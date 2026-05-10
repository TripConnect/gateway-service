import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from 'src/app.controller';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { UserModule } from 'src/user/user.module';
import { UserResolver } from 'src/user/user.resolver';
import { ConfigHelper } from 'common-utils';
import { Request, Response } from 'express';
import { TwofaModule } from 'src/twofa/twofa.module';
import { TwofaResolver } from 'src/twofa/twofa.resolver';
import { ChatModule } from 'src/chat/chat.module';
import { ConversationResolver } from 'src/chat/conversation.resolver';
import { MessageResolver } from 'src/chat/message.resolver';
import { LivestreamModule } from 'src/livestream/livestream.module';
import { LivestreamResolver } from 'src/livestream/livestream.resolver';
import { setCurrentUserOnActiveSpanFromToken } from 'src/tracing/user-tracing';

export interface GatewayContext {
  req: Request;
  res: Response;
  currentUserId: string | null;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      // eslint-disable-next-line @typescript-eslint/unbound-method
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
        const accessToken = req.cookies?.['access_token'] as string | undefined;
        const currentUserId = setCurrentUserOnActiveSpanFromToken(accessToken);
        return {
          req,
          res,
          currentUserId,
        };
      },
    }),
    UserModule,
    TwofaModule,
    ChatModule,
    LivestreamModule,
  ],
  controllers: [AppController],
  providers: [
    UserResolver,
    TwofaResolver,
    ConversationResolver,
    MessageResolver,
    LivestreamResolver,
  ],
})
export class AppModule {}
