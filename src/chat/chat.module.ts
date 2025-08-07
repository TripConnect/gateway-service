import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule } from '../kafka/kafka.module';
import { ChatConsumer } from './chat.consumer';

@Module({
  imports: [ConfigModule, KafkaModule],
  providers: [ChatService, ChatGateway, ChatConsumer],
  exports: [ChatService],
})
export class ChatModule {}
