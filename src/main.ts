import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GrpcExceptionFilter } from './shared/filter';
import { ConfigHelper } from 'common-utils';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalFilters(new GrpcExceptionFilter());
  await app.listen(ConfigHelper.read('server.port') as number);
}
void bootstrap();
