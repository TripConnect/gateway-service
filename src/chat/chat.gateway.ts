import { UseGuards } from "@nestjs/common";
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, WsResponse } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import { WsAuthGuard } from "src/guards/socket.guard";
import { CreateChatMessageRequest } from "common-utils/protos/defs/chat_service_pb";
import { ChatService } from "./chat.service";
import { SocketChatMessageRequest, SocketChatMessageResponse } from "./models/socket.model";


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

    @SubscribeMessage('message')
    async handleChatMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: SocketChatMessageRequest
    ): Promise<SocketChatMessageResponse> {
        let chatMessageRequest = new CreateChatMessageRequest()
            .setConversationId(data.conversationId)
            .setContent(data.content)
            .setFromUserId(client.data.user.userId);
        let message = await this.chatService.createChatMessage(chatMessageRequest);
        return {
            conversationId: data.conversationId,
            content: message.content,
            fromUserId: client.data.user.userId,
            createdAt: message.createdAt,
        };
    }
}