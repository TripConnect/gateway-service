import { UseGuards } from "@nestjs/common";
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, WsResponse } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import { WsAuthGuard } from "src/guards/socket.guard";
import { CreateChatMessageRequest } from "common-utils/protos/defs/chat_service_pb";
import { SocketChatMessageRequest, SocketChatMessageResponse } from "./models/chat-message.model";
import { ChatService } from "./chat.service";


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
            .setMessageContent(data.content)
            .setFromUserId(client.data.user.userId);
        let chatMessage = await this.chatService.createChatMessage(chatMessageRequest);
        return {
            conversationId: chatMessage.getConversationId(),
            content: chatMessage.getMessageContent(),
            fromUserId: chatMessage.getFromUserId(),
            createdAt: chatMessage.getCreatedAt(),
        };
    }
}