import { UseGuards } from "@nestjs/common";
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, WsResponse } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import { WsAuthGuard } from "src/guards/socket.guard";
import { CreateChatMessageRequest } from "common-utils/protos/defs/chat_service_pb";
import { ChatService } from "./chat.service";
import { SocketChatMessageRequest, SocketChatMessageEvent, SocketChatMessageResponse } from "./models/socket.model";
import { TokenHelper } from "common-utils";


@UseGuards(WsAuthGuard)
@WebSocketGateway({
    namespace: 'chat',
    cors: {
        origin: '*',
    },
})
export class ChatGateway {

    constructor(private readonly chatService: ChatService) { }

    @WebSocketServer()
    server: Server;

    async handleConnection(client: Socket) {
        const { token } = client.handshake.auth;
        try {
            const payload = TokenHelper.verify(token);
            if (!payload) {
                console.log('Socket rejected: Invalid token');
                return client.disconnect();
            }
            client.data.user = payload;
            console.log('Socket connected:', payload.userId);
        } catch (err) {
            console.error('Socket connection error:', err);
            client.disconnect();
        }
    }

    @SubscribeMessage('message')
    async handleChatMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() event: SocketChatMessageRequest
    ): Promise<SocketChatMessageResponse> {
        try {
            let chatMessageRequest = new CreateChatMessageRequest()
                .setConversationId(event.conversationId)
                .setContent(event.content)
                .setFromUserId(client.data.user.userId);
            let message = await this.chatService.createChatMessage(chatMessageRequest);

            let emitEvent: SocketChatMessageEvent = {
                content: message.content,
                fromUserId: message.fromUser.id,
                createdAt: message.createdAt.toISOString(),
            }
            client.to(event.conversationId).emit("message", emitEvent);

            return {
                status: "DONE",
            };
        } catch (error) {
            return { status: "FAILED" }
        }
    }
}