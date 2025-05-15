import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TokenHelper } from 'common-utils';
import { Socket } from 'socket.io';

@Injectable()
export class WsAuthGuard implements CanActivate {

    canActivate(context: ExecutionContext): boolean {
        const client = context.switchToWs().getClient<Socket>();
        const { token } = client.handshake.auth;

        try {
            const payload = TokenHelper.verify(token);
            if (!payload) {
                console.info("Socket rejected");
                return false;
            }
            client.data.user = payload;
            console.info("Socket connected " + payload.userId);
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }
}
