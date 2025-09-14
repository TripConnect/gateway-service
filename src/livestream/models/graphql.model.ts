import { Field, ID, ObjectType } from '@nestjs/graphql';

import { Livestream as GrpcLivestream } from 'node-proto-lib/protos/livestream_service_pb';

@ObjectType()
export class Livestream {
  @Field((type) => ID)
  id: string;

  @Field()
  createdBy: string;

  @Field()
  hlsLink: string;

  constructor(init?: Partial<Livestream>) {
    Object.assign(this, init);
  }

  static fromGrpc(grpcMessage: GrpcLivestream): Livestream {
    return new Livestream({
      id: grpcMessage.getId(),
      hlsLink: grpcMessage.getHlsLink(),
      createdBy: 'TODO :v', // TODO: impl here
    });
  }
}
