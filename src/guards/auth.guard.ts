import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { TokenHelper } from 'common-utils';

@Injectable()
export class GqlAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    const req = ctx.getContext().req;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    const accessToken: string = req.cookies && req.cookies['access_token'];

    const jwtBody = TokenHelper.verify(accessToken);

    if (!jwtBody) {
      throw new UnauthorizedException('Not authenticated');
    }

    return true;
  }
}
