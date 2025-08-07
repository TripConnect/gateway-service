import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GrpcExceptionFilter } from './shared/filter';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'gateway',
          brokers: ['localhost:9092'],
        },
        consumer: {
          groupId: 'gateway-service',
        },
      },
    },
  );

  app.useGlobalFilters(new GrpcExceptionFilter());

  void app.listen();
}
void bootstrap();
