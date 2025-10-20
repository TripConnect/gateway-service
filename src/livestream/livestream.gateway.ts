import { Injectable, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  SessionData,
  SocketListenLivestreamRequest,
} from './models/socket.model';
import { ConfigHelper, TokenHelper } from 'common-utils';
import { WsAuthGuard } from 'src/guards/socket.guard';
import { extractCookies } from 'src/common/cookie';
import { KafkaService } from '../kafka/kafka.service';

@UseGuards(WsAuthGuard)
@WebSocketGateway({
  namespace: 'livestream',
  cors: {
    origin: '*',
  },
})
@Injectable()
export class LivestreamGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly kafkaService: KafkaService) {}

  handleConnection(client: Socket<any, any, any, SessionData>) {
    const cookies = extractCookies(client.handshake.headers.cookie as string);

    const token = cookies['access_token'];
    try {
      const jwtBody = TokenHelper.verify(token);
      if (!jwtBody) {
        console.log('Socket rejected: Invalid token');
        return client.disconnect();
      }
      client.data.user = jwtBody;
      console.log('Socket connected:', jwtBody.userId);
    } catch (err) {
      console.error('Socket connection error:', err);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket<any, any, any, SessionData>) {
    let topic = 'kafka.topic.livestream-fct-viewer-disconnected';
    if (client.data?.livestream?.role === 'HOST') {
      topic = 'kafka.topic.livestream-fct-host-disconnected';
    }

    await this.kafkaService.publish(ConfigHelper.read(topic) as string, {
      livestreamId: client.data.livestream.id,
    });
  }

  @SubscribeMessage('listen')
  async listenRoom(
    @ConnectedSocket() client: Socket<any, any, any, SessionData>,
    @MessageBody() event: SocketListenLivestreamRequest,
  ) {
    // TODO: Check again
    client.data.livestream = {
      id: event.livestreamId,
      role: event.role,
    };

    await client.join(event.livestreamId);
  }

  @SubscribeMessage('unlisten')
  async unlistenRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() event: SocketListenLivestreamRequest,
  ) {
    await client.leave(event.livestreamId);
  }
}
