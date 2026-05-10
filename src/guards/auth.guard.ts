import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { TokenHelper } from 'common-utils';
import type { GatewayContext } from 'src/app.module';
import { setCurrentUserOnActiveSpan } from 'src/tracing/user-tracing';

@Injectable()
export class GqlAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context);
    const gqlContext = ctx.getContext<GatewayContext>();

    const accessToken = gqlContext.req.cookies?.['access_token'] as
      | string
      | undefined;

    const jwtBody = accessToken ? TokenHelper.verify(accessToken) : null;

    if (!jwtBody) {
      throw new UnauthorizedException('Not authenticated');
    }

    gqlContext.currentUserId = jwtBody.userId;
    setCurrentUserOnActiveSpan(jwtBody.userId);

    return true;
  }
}
