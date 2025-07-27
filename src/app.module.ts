import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { UserModule } from './user/user.module';
import { UserResolver } from './user/user.resolver';
import { ConfigHelper, TokenHelper } from 'common-utils';
import { Request, Response } from 'express';
import { TwofaModule } from './twofa/twofa.module';
import { TwofaResolver } from './twofa/twofa.resolver';
import { ChatModule } from './chat/chat.module';
import { ConversationResolver } from './chat/conversation.resolver';
import { MessageResolver } from './chat/message.resolver';

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
      autoSchemaFile: 'schema.gql',
      sortSchema: true,
      context: ({
        req,
        res,
      }: {
        req: Request;
        res: Response;
      }): GatewayContext => {
        const accessToken = req.headers.authorization?.split(
          ' ',
        )?.[1] as string;
        const jwtBody = TokenHelper.verify(accessToken);
        return {
          currentUserId: jwtBody?.userId || null,
        };
      },
    }),
    UserModule,
    TwofaModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [
    UserResolver,
    TwofaResolver,
    ConversationResolver,
    MessageResolver,
  ],
})
export class AppModule {}
