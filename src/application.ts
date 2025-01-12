import 'dotenv/config';

const http = require('http');
import express, { Request, Response } from 'express';
import { Server } from 'socket.io';
import cors from 'cors';
import { json } from 'body-parser';
const fs = require('fs')
const path = require('path');
import { expressMiddleware } from '@apollo/server/express4';
import jwt from 'jsonwebtoken';
import morgan from 'morgan';
import { graphqlUploadExpress } from 'graphql-upload-ts';
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
import { PassThrough } from 'stream';
import { instrument } from "@socket.io/admin-ui";

import gqlServer from 'services/graphql';
import ChatService from 'services/grpc/chatService';
import logger from 'utils/logging';

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    }
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
    if (!token) {
        socket.disconnect(true);
        logger.warn({ "message": "Reject socketio connection" })
        return;
    }
    let { userId } = jwt.verify(token, process.env.JWT_SECRET_KEY || "") as { userId: string };
    socket.data.userId = userId;
    console.info({ message: "Chat socket connected", userId });

    let conversations = await ChatService.searchConversations({ memberIds: [userId] });

    for (let conversation of conversations) {
        logger.debug({
            message: "Join conversation",
            userId: socket.data.userId,
            conversationId: conversation.id,
        });
        socket.join(conversation.id);
    }

    socket.on("message", async (event, callback: Function) => {
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
    if (!token) {
        socket.disconnect(true);
        logger.error({ "message": "Reject socketio connection" })
        return;
    }
    let { userId } = jwt.verify(token, process.env.JWT_SECRET_KEY || "") as { userId: string };
    console.info({ message: "Livestream socket connected", userId });

    socket.data.userId = userId;
    const inputStream = new PassThrough();

    socket.on("start", async (event, callback: Function) => {
        try {
            let { roomId } = event;
            logger.info({ message: "Start lives", roomId });

            let livestreamDir = path.join(HLS_PATH, roomId);

            if (!fs.existsSync(livestreamDir)) {
                fs.mkdirSync(livestreamDir, { recursive: true });
            }

            // Start FFmpeg to convert the WebSocket stream to HLS
            let ffmpegCommand = ffmpeg(inputStream)
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
                    console.log(`FFmpeg started for livestream ID: ${roomId}`);
                })
                .on('error', (err: any) => {
                    console.error(`FFmpeg error for livestream ID ${roomId}:`, err);
                })
                .run(); // Start FFmpeg
            // callback({ status: 'DONE' });
        } catch (error: any) {
            logger.error({ message: 'Cannot saving hls segment', error });
            logger.error(error.message);
            // callback({ status: 'ERROR' });
        }
    });

    socket.on("segment", async (event, callback: Function) => {
        try {
            let { roomId, segment } = event;
            logger.info({ message: "Record segment", roomId });
            inputStream.write(segment);
            // callback({ status: 'DONE' });
        } catch (error) {
            logger.error('Error while saving livestream segment');
            // callback({ status: 'ERROR' });
        }
    });

    socket.on("disconnect", async (event, callback: Function) => {
        try {
            logger.info({ message: "Record segment ends" });
            inputStream.end();
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
            context: async ({ req, res }) => {
                try {
                    let accessToken = req.headers.authorization?.split(" ")[1] as string;
                    let currentUserId: string | null = null;
                    if (accessToken) {
                        let encoded = jwt.verify(accessToken, process.env.JWT_SECRET_KEY || "") as { userId: string };
                        currentUserId = encoded.userId;
                    }
                    return {
                        currentUserId,
                    }
                } catch (error: any) {
                    return {
                        currentUserId: null,
                    }
                }
            }
        })
    ));

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
