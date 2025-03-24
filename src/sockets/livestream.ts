import { Server } from "socket.io";
const path = require('path');
const fs = require('fs');
import { PassThrough } from 'stream';
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

import { TokenHelper } from "common-utils";
import logger from "utils/logging";
import { livestreamStartValidator } from 'utils/validators';

ffmpeg.setFfmpegPath(ffmpegPath);

export function start(socketServer: Server) {
    const livesNamespace = socketServer.of('/livestream');

    const PUBLIC_PATH = path.join(__dirname, '../public');
    const LIVESTREAM_FOLDER = 'livestreams';
    const HLS_PATH = path.join(PUBLIC_PATH, LIVESTREAM_FOLDER);

    livesNamespace.on("connection", async (socket) => {
        let { token } = socket.handshake.auth;
        let jwtBody = TokenHelper.verify(token);
        if (!token || !jwtBody) {
            socket.disconnect(true);
            logger.error({ "message": "Reject livestream socketio connection" })
            return;
        }

        // console.info({ message: "Livestream socket connected", userId });

        socket.data.userId = jwtBody.userId;
        socket.data.inputStream = new PassThrough();

        socket.data.inputStream.on('error', (err: any) => {
            logger.error({ message: "Input stream error", error: err.message });
        });

        socket.on("start", async (
            event: { roomId: string },
            callback: (ack: { status: 'SUCCESS' | 'FAILED' }) => void
        ) => {
            try {
                let { error } = livestreamStartValidator.validate(event);
                if (error) {
                    logger.error({ "message": "Invalid event of starting livestream" });
                    return;
                }

                logger.info({ message: "Start lives", roomId: event.roomId });

                let livestreamDir = path.join(HLS_PATH, event.roomId);

                if (!fs.existsSync(livestreamDir)) {
                    fs.mkdirSync(livestreamDir, { recursive: true });
                }

                // Start FFmpeg to convert the WebSocket stream to HLS
                let ffmpegCommand = ffmpeg(socket.data.inputStream)
                    .inputFormat('webm')
                    .videoCodec('copy')
                    .audioCodec('copy')
                    .outputOptions([
                        '-hls_time 10',
                        '-hls_list_size 0',
                        '-hls_flags delete_segments+append_list',
                    ])
                    .output(path.join(livestreamDir, 'streaming.m3u8'))
                    .on('start', () => {
                        logger.debug({ message: "FFmpeg started", roomId: event.roomId });
                    })
                    .on('error', (err: any) => {
                        logger.error({ message: "FFmpeg error", roomId: event.roomId });
                    })
                    .on('end', () => {
                        logger.debug({ message: "FFmpeg ended", roomId: event.roomId });
                    })
                    .run(); // Start FFmpeg
                callback({ status: 'SUCCESS' });
            } catch (error: any) {
                logger.error({ message: 'Cannot saving hls segment', error });
                callback({ status: 'FAILED' });
            }
        });

        socket.on("segment", async (
            event: { roomId: string, segment: Blob | any },
            callback: (ack: { status: 'SUCCESS' | 'FAILED' }) => void
        ) => {
            try {
                let { roomId, segment } = event;
                logger.info({ message: "Record segment", roomId });

                // Ensure the segment is a Buffer
                if (!(segment instanceof Buffer)) {
                    logger.debug({ message: "Standardize segment" });
                    segment = Buffer.from(segment);
                }

                let isRecorded = socket.data.inputStream.write(segment, (error: any) => {
                    if (error) {
                        logger.error({ message: "Failed to write segment", roomId: event.roomId, error: error.message });
                    }
                });
                logger.debug({ message: "Record segment " + isRecorded });
                callback({ status: isRecorded ? 'SUCCESS' : 'FAILED' });
            } catch (error) {
                logger.error('Error while saving livestream segment');
                callback({ status: 'FAILED' });
            }
        });

        socket.on("disconnect", async (event) => {
            try {
                logger.info({ message: "Record segment ends" });
                socket.data.inputStream.end();
                // callback({ status: 'DONE' });
            } catch (error) {
                logger.error('Ends livestream');
                // callback({ status: 'ERROR' });
            }
        });
    });
}
