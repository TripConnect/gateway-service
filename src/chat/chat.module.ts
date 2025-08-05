import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KAFKA_BROKERS } from '../shared/kafka';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.register([
      {
        name: 'CHAT_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'chatting',
            brokers: KAFKA_BROKERS,
          },
          consumer: {
            groupId: 'gateway-service',
          },
        },
      },
    ]),
  ],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}
