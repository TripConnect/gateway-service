import { Injectable, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { SocketListenConversationRequest } from './models/socket.model';
import { TokenHelper } from 'common-utils';
import { WsAuthGuard } from 'src/guards/socket.guard';

@UseGuards(WsAuthGuard)
@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: '*',
  },
})
@Injectable()
export class ChatGateway {
  constructor(private readonly chatService: ChatService) {}

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
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
    await client.join(event.conversationId);
  }

  @SubscribeMessage('unlisten')
  async unlistenRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() event: SocketListenConversationRequest,
  ) {
    await client.leave(event.conversationId);
  }
}
