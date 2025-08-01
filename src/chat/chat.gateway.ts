import { UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CreateChatMessageRequest } from 'node-proto-lib/protos/chat_service_pb';
import { ChatService } from './chat.service';
import {
  SocketChatMessageRequest,
  SocketChatMessageEvent,
  SocketChatMessageResponse,
  SocketListenConversationRequest,
} from './models/socket.model';
import { TokenHelper } from 'common-utils';
import { WsAuthGuard } from 'src/guards/socket.guard';

@UseGuards(WsAuthGuard)
@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: '*',
  },
})
export class ChatGateway {
  constructor(private readonly chatService: ChatService) {}

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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      client.data.user = payload;
      console.log('Socket connected:', payload.userId);
    } catch (err) {
      console.error('Socket connection error:', err);
      client.disconnect();
    }
  }

  @SubscribeMessage('listen')
  async listenRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() event: SocketListenConversationRequest,
  ) {
    // console.log(`user(${client.data.user.userId}) join conversation(${event.conversationId})`);
    await client.join(event.conversationId);
  }

  @SubscribeMessage('unlisten')
  async unlistenRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() event: SocketListenConversationRequest,
  ) {
    await client.leave(event.conversationId);
  }

  @SubscribeMessage('message')
  async handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() event: SocketChatMessageRequest,
  ): Promise<SocketChatMessageResponse> {
    try {
      const chatMessageRequest = new CreateChatMessageRequest()
        .setConversationId(event.conversationId)
        .setContent(event.content)
        .setFromUserId(client.data.user.userId);
      const message =
        await this.chatService.createChatMessage(chatMessageRequest);

      const emitEvent: SocketChatMessageEvent = {
        content: message.content,
        fromUserId: message.fromUser.id,
        createdAt: message.createdAt.toISOString(),
      };
      client.to(event.conversationId).emit('message', emitEvent);

      return {
        status: 'DONE',
      };
    } catch (error) {
      return { status: 'FAILED' };
    }
  }
}
