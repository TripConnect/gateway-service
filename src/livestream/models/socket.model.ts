import { JwtBody } from 'common-utils';

type Role = 'HOST' | 'VIEWER';

export type SessionData = {
  user: JwtBody;
  livestream: {
    id: string;
    role: Role;
  };
};

export type SocketListenLivestreamRequest = {
  role: Role;
  livestreamId: string;
};
