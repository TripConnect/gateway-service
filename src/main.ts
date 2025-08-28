import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GrpcExceptionFilter } from './shared/filter';
import { ConfigHelper } from 'common-utils';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ConfigHelper.read('allow-origins') as string[],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });
  app.use(cookieParser());
  app.useGlobalFilters(new GrpcExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('The gateway-service swagger')
    .setDescription('The gateway-service API documentation')
    .setVersion('1.0')
    .addTag('gateway-service')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(ConfigHelper.read('server.port') as number);
}

void bootstrap();
