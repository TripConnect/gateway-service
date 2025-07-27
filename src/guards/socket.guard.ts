import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TokenHelper } from 'common-utils';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';

@Injectable()
export class WsAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    const { token } = client.handshake.auth;
    try {
      const payload = TokenHelper.verify(token);
      if (!payload) {
        console.log('Socket rejected');
        return false;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      client.data.user = payload;
      console.log('Socket connected ' + payload.userId);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}
