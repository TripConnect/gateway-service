import 'dotenv/config';

const http = require('http');
import express, { Request, Response } from 'express';
import { Server } from 'socket.io';
import cors from 'cors';
import { json } from 'body-parser';
const fs = require('fs')
const path = require('path');
import { expressMiddleware } from '@apollo/server/express4';
import morgan from 'morgan';
import { graphqlUploadExpress } from 'graphql-upload-ts';
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
import { PassThrough } from 'stream';

import gqlServer, { GatewayContext } from 'services/graphql';
import ChatService from 'services/grpc/chatService';
import logger from 'utils/logging';
import { livestreamStartValidator } from 'utils/validators';
import { TokenHelper } from 'common-utils';

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    },
    maxHttpBufferSize: 5e6
});

const PORT = process.env.GATEWAY_SERVICE_PORT || 31071;
const PUBLIC_PATH = path.join(__dirname, 'public');
const accessLogStream = fs.createWriteStream(path.join(__dirname, '../log/access.log'), { flags: 'a' });

const chatNamespace = io.of('/chat');

const livesNamespace = io.of('/livestream');
const LIVESTREAM_FOLDER = 'livestreams';
const HLS_PATH = path.join(PUBLIC_PATH, LIVESTREAM_FOLDER);

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', { stream: accessLogStream }));
app.use(express.static(PUBLIC_PATH));
app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }))

chatNamespace.on("connection", async (socket) => {
    let { token } = socket.handshake.auth;
    let jwtBody = TokenHelper.verify(token);

    if (!token || !jwtBody) {
        socket.disconnect(true);
        logger.warn({ "message": "Reject socketio connection" })
        return;
    }

    socket.data.userId = jwtBody.userId;
    console.info({ message: "Chat socket connected", userId: socket.data.userId });

    let conversations = await ChatService.searchConversations({ memberIds: [socket.data.userId] });

    for (let conversation of conversations) {
        logger.debug({
            message: "Join conversation",
            userId: socket.data.userId,
            conversationId: conversation.id,
        });
        socket.join(conversation.id);
    }

    socket.on("message", async (
        event: { conversationId: string, content: string },
        callback: (ack: { status: 'DONE' }) => void
    ) => {
        try {
            let { conversationId, content } = event;
            let rpcMessage = await ChatService.createChatMessage({ conversationId, messageContent: content, fromUserId: socket.data.userId });

            let chatPayload = {
                conversationId,
                fromUserId: socket.data.userId,
                content,
                createdAt: rpcMessage.createdAt,
            }
            logger.debug({ message: "New chat message", payload: chatPayload });
            socket.to(conversationId).emit("message", chatPayload);
            callback({ status: 'DONE' });
        } catch (error: any) {
            console.error(error);
            logger.error(error.message);
        }
    });
});

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
            console.log(callback);
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

app.get('/status', (req: Request, res: Response) => {
    res.status(200).json({ status: "OK", });
});

gqlServer
    .start()
    .then(() => app.use(
        '/graphql',
        cors<cors.CorsRequest>(),
        json(),
        expressMiddleware(gqlServer, {
            context: async ({ req, res }): Promise<GatewayContext> => {
                let accessToken = req.headers.authorization?.split(" ")?.[1] as string;
                let jwtBody = TokenHelper.verify(accessToken);
                return {
                    currentUserId: jwtBody?.userId || null
                }
            }
        })
    ));

server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});
