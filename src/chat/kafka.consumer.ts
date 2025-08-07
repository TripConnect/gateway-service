import { Payload, MessagePattern } from '@nestjs/microservices';
import { Controller } from '@nestjs/common';
import { ConfigHelper } from 'common-utils';

@Controller()
export class KafkaConsumer {
  @MessagePattern(
    ConfigHelper.read('kafka.topic.chatting-fct-sent-message') as string,
  )
  handleEvent(@Payload() data) {
    console.log(data);
  }
}
