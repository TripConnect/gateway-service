import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigHelper, KafkaProducer } from 'common-utils';
import { Kafka, logLevel as KafkaLogLevel } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit {
  private kafkaInstance: Kafka;
  private kafkaProducer: KafkaProducer;

  onModuleInit() {
    this.kafkaInstance = new Kafka({
      clientId: process.env.SERVICE_NAME,
      brokers: [
        `${ConfigHelper.read('kafka.host')}:${ConfigHelper.read('kafka.port')}`,
      ],
      logLevel: KafkaLogLevel.ERROR,
    });

    this.kafkaProducer = new KafkaProducer(this.kafkaInstance);
  }

  getClient(): Kafka {
    return this.kafkaInstance;
  }

  async publish(topic: string, payload: Record<string, any>) {
    await this.kafkaProducer.publish({
      topic,
      message: JSON.stringify(payload),
    });
  }
}
