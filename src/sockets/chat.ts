import { TokenHelper } from "common-utils";
import ChatService from "services/grpc/chatService";
import { Server } from "socket.io";
import logger from "utils/logging";

export function start(socketServer: Server) {
    const chatNamespace = socketServer.of('/chat');

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
}