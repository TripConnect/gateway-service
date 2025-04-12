import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { UserModule } from './user/user.module';
import { UserResolver } from './user/user.resolver';
import { ConfigHelper, TokenHelper } from 'common-utils';
import { Request, Response } from 'express';

export interface GatewayContext {
  currentUserId: string | null;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [ConfigHelper.readAll],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      context: ({ req, res }: { req: Request, res: Response }): GatewayContext => {
        let accessToken = req.headers.authorization?.split(" ")?.[1] as string;
        let jwtBody = TokenHelper.verify(accessToken);
        return {
          currentUserId: jwtBody?.userId || null
        }
      }
    }),
    UserModule,
  ],
  controllers: [AppController],
  providers: [UserResolver],
})
export class AppModule { }
