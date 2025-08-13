import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { TokenExpiredError } from 'jsonwebtoken';

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const { req, res } = ctx.getContext();

    try {
      const result = await super.canActivate(context);
      return result as boolean;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        // Get expired token payload without verification
        const expiredToken = req.cookies.access_token;
        const expiredPayload = this.decodeExpiredToken(expiredToken);
        
        // Check refresh token
        const refreshToken = req.cookies.refresh_token;
        if (refreshToken && expiredPayload) {
          try {
            // Attempt to refresh tokens
            const newTokens = await this.refreshTokens(refreshToken, expiredPayload);
            
            // Set new cookies
            res.cookie('access_token', newTokens.accessToken, {
              httpOnly: true,
              secure: true,
              sameSite: 'strict',
            });

            if (newTokens.refreshToken) {
              res.cookie('refresh_token', newTokens.refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
              });
            }

            // Update request cookie for current request
            req.cookies.access_token = newTokens.accessToken;
            
            // Retry authentication with new token
            return super.canActivate(context) as Promise<boolean>;
          } catch (refreshError) {
            // Clear invalid tokens
            res.clearCookie('access_token');
            res.clearCookie('refresh_token');
            return false;
          }
        }
      }
      return false;
    }
  }

  private decodeExpiredToken(token: string): any {
    try {
      // Using jwt.decode to get payload without verification
      const jwt = require('jsonwebtoken');
      return jwt.decode(token);
    } catch {
      return null;
    }
  }

  private async refreshTokens(refreshToken: string, expiredPayload: any) {
    // Implement your token refresh logic here
    // You can use the expiredPayload to verify the refresh token belongs to the same user
    // Return { accessToken: string, refreshToken?: string }
  }
}