import { Module } from '@nestjs/common';
import { ChatGateway } from 'src/chat/chat.gateway';
import { ChatService } from 'src/chat/chat.service';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule } from 'src/kafka/kafka.module';
import { ChatConsumer } from 'src/chat/chat.consumer';

@Module({
  imports: [ConfigModule, KafkaModule],
  providers: [ChatService, ChatGateway, ChatConsumer],
  exports: [ChatService],
})
export class ChatModule {}
