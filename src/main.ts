import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigHelper } from 'common-utils';
import { GrpcExceptionFilter } from './shared/filter';
import {
  KafkaStatus,
  MicroserviceOptions,
  Transport,
} from '@nestjs/microservices';
import { KAFKA_BROKERS } from './shared/kafka';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const server = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: KAFKA_BROKERS,
      },
      consumer: {
        groupId: 'gateway-service',
      },
    },
  });

  server.status.subscribe((status: KafkaStatus) => {
    console.log(status);
  });

  app.enableCors();
  app.useGlobalFilters(new GrpcExceptionFilter());

  await app.listen(ConfigHelper.read('server.port') as number);
}
void bootstrap();
