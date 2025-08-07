import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigHelper, KafkaListener, TopicResolver } from 'common-utils';
import { ChatGateway } from './chat.gateway';
import { KafkaService } from '../kafka/kafka.service';

@Injectable()
export class ChatConsumer implements OnModuleInit {
  constructor(
    private readonly chatGateway: ChatGateway,
    private readonly kafkaService: KafkaService,
  ) {}

  private readonly resolvers: TopicResolver[] = [
    {
      groupId: process.env.SERVICE_NAME || 'gateway-service',
      topic: ConfigHelper.read(
        'kafka.topic.chatting-fct-sent-message',
      ) as string,
      resolver: async ({
        id,
        correlation_id,
        conversation_id,
        from_user_id,
        content,
        sent_time,
        created_at,
      }) => {
        console.log(content);
        this.chatGateway.server.to(conversation_id).emit('new_message', {
          id,
          correlationId: correlation_id,
          conversationId: conversation_id,
          fromUserId: from_user_id,
          content,
          sentTime: sent_time,
          createdAt: created_at,
        });
      },
    },
  ];

  async onModuleInit() {
    const kafkaListener = new KafkaListener(
      this.kafkaService.getClient(),
      this.resolvers,
    );
    await kafkaListener.listen();
  }
}
