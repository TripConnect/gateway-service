import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigHelper, KafkaListener, TopicResolver } from "common-utils";
import { Kafka, logLevel as KafkaLogLevel } from "kafkajs";
import { ChatGateway } from "./chat.gateway";

@Injectable()
export class KafkaConsumerService implements OnModuleInit {
  constructor(
    private readonly chatGateway: ChatGateway,
  ) { }

  private readonly resolvers: TopicResolver[] = [
    {
      groupId: process.env.SERVICE_NAME || 'gateway-service',
      topic: ConfigHelper.read("kafka.topic.chatting-fct-sent-message"),
      resolver: async ({ id, correlation_id, conversation_id, from_user_id, content, sent_time, created_at }) => {
        this.chatGateway.server.to(conversation_id).emit("new_message", {
          id,
          correlationId: correlation_id,
          conversationId: conversation_id,
          fromUserId: from_user_id,
          content,
          sentTime: sent_time,
          createdAt: created_at,
        });
      },
    }
  ]

  async onModuleInit() {
    let kafkaInstance = new Kafka({
      clientId: process.env.SERVICE_NAME,
      brokers: [`${ConfigHelper.read("kafka.host")}:${ConfigHelper.read("kafka.port")}`],
      logLevel: KafkaLogLevel.ERROR,
    })

    const kafkaListener = new KafkaListener(kafkaInstance, this.resolvers);
    kafkaListener.listen();
  }
}
