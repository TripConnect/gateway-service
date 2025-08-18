import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GrpcExceptionFilter } from './shared/filter';
import { ConfigHelper } from 'common-utils';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ConfigHelper.read('allow-origins') as string[],
    credentials: true,
  });
  app.use(cookieParser());
  app.useGlobalFilters(new GrpcExceptionFilter());
  await app.listen(ConfigHelper.read('server.port') as number);
}
void bootstrap();
