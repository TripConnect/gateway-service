import { Module, Global } from '@nestjs/common';
import { KafkaService } from 'src/kafka/kafka.service';

@Global()
@Module({
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}
