import {
  Ctx,
  EventPattern,
  KafkaContext,
  Payload,
} from '@nestjs/microservices';
import { ConfigHelper } from 'common-utils';

export class KafkaConsumer {
  @EventPattern(
    ConfigHelper.read('kafka.topic.chatting-fct-sent-message') as string,
  )
  async handleEvent(@Payload() data, @Ctx() context: KafkaContext) {
    console.info(data);
  }
}
