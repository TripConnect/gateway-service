import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigHelper } from 'common-utils';
import { GrpcExceptionFilter } from './shared/filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalFilters(new GrpcExceptionFilter());
  await app.listen(ConfigHelper.read('server.port'));
}
bootstrap();
