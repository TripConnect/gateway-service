import { Field, ID, ObjectType } from '@nestjs/graphql';

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
}
