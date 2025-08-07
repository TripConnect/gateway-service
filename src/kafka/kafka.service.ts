import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigHelper } from 'common-utils';
import { Kafka, logLevel as KafkaLogLevel } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit {
  private kafkaInstance: Kafka;

  onModuleInit() {
    this.kafkaInstance = new Kafka({
      clientId: process.env.SERVICE_NAME,
      brokers: [
        `${ConfigHelper.read('kafka.host')}:${ConfigHelper.read('kafka.port')}`,
      ],
      logLevel: KafkaLogLevel.ERROR,
    });
  }

  getClient(): Kafka {
    return this.kafkaInstance;
  }
}
