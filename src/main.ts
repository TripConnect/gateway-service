import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { ConfigHelper } from 'common-utils';
import { AppModule } from 'src/app.module';
import { GrpcExceptionFilter } from 'src/shared/filter';

function configureCors(app: INestApplication) {
  app.enableCors({
    origin: ConfigHelper.read('allow-origins') as string[],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });
}

function configureGlobalMiddleware(app: INestApplication) {
  app.use(cookieParser());
  app.useGlobalFilters(new GrpcExceptionFilter());
}

function configureSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('The gateway-service swagger')
    .setDescription('The gateway-service API documentation')
    .setVersion('1.0')
    .addTag('gateway-service')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  configureCors(app);
  configureGlobalMiddleware(app);
  configureSwagger(app);

  await app.listen(ConfigHelper.read('server.port') as number, '0.0.0.0');
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap application', error);
  process.exit(1);
});
