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
      context: ({ req, res }: { req: Request, res: Response }): GatewayContext => {
        let accessToken = req.headers.authorization?.split(" ")?.[1] as string;
        let jwtBody = TokenHelper.verify(accessToken);
        return {
          currentUserId: jwtBody?.userId || null
        }
      }
    }),
    UserModule,
    TwofaModule,
  ],
  controllers: [AppController],
  providers: [UserResolver, TwofaResolver],
})
export class AppModule { }
