import 'dotenv/config';

const http = require('http');
import express, { Request, Response } from 'express';
import { Server } from 'socket.io';
import cors from 'cors';
import { json } from 'body-parser';
const fs = require('fs');
const path = require('path');
import { expressMiddleware } from '@apollo/server/express4';
import morgan from 'morgan';
import { graphqlUploadExpress } from 'graphql-upload-ts';

import gqlServer, { GatewayContext } from 'services/graphql';
import { ConfigHelper, TokenHelper } from 'common-utils';
import logger from 'utils/logging';
import { start as startLivesSocket } from 'sockets/livestream';
import { start as startChatSocket } from 'sockets/chat';

ConfigHelper.load();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    },
    maxHttpBufferSize: 5e6
});

const PORT = ConfigHelper.read("server.port");
const PUBLIC_PATH = path.join(__dirname, "public");
const accessLogStream = fs.createWriteStream(path.join(__dirname, "../log/access.log"), { flags: "a" });

startLivesSocket(io);
startChatSocket(io);

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', { stream: accessLogStream }));
app.use(express.static(PUBLIC_PATH));
app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }))

app.get("/status", (req: Request, res: Response) => {
    res.status(200).json({ status: "OK", });
});

gqlServer
    .start()
    .then(() => app.use(
        "/graphql",
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
