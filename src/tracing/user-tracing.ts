import { trace } from '@opentelemetry/api';
import { RequestHandler } from 'express';
import { TokenHelper } from 'common-utils';

export const USER_ID_TRACE_ATTRIBUTE = 'user.id';

type RequestCookies = {
  cookies?: Record<string, string | undefined>;
};

export function setCurrentUserOnActiveSpan(userId?: string | null): void {
  if (!userId) return;

  trace.getActiveSpan()?.setAttributes({
    [USER_ID_TRACE_ATTRIBUTE]: userId,
  });
}

export function setCurrentUserOnActiveSpanFromToken(
  accessToken?: string,
): string | null {
  if (!accessToken) return null;

  const jwtBody = TokenHelper.verify(accessToken);
  const userId = jwtBody?.userId || null;
  setCurrentUserOnActiveSpan(userId);

  return userId;
}

export const userTraceMiddleware: RequestHandler = (req, _res, next) => {
  const { cookies } = req as unknown as RequestCookies;
  const accessToken = cookies?.access_token;
  setCurrentUserOnActiveSpanFromToken(accessToken);
  next();
};
