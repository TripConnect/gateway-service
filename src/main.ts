import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigHelper } from 'common-utils';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(ConfigHelper.read("server.port"));
}
bootstrap();
