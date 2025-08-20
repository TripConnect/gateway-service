import { Injectable, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketListenConversationRequest } from './models/socket.model';
import { TokenHelper } from 'common-utils';
import { WsAuthGuard } from 'src/guards/socket.guard';
import { extractCookies } from './common/cookie';

@UseGuards(WsAuthGuard)
@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: '*',
  },
})
@Injectable()
export class ChatGateway {
  constructor() {}

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const cookies = extractCookies(client.handshake.headers.cookie as string);

    const token = cookies['access_token'];
    try {
      const jwtBody = TokenHelper.verify(token);
      if (!jwtBody) {
        console.log('Socket rejected: Invalid token');
        return client.disconnect();
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      client.data.user = jwtBody;
      console.log('Socket connected:', jwtBody.userId);
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
