import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ResponseModel {
  @Field()
  success: boolean;

  constructor(status: boolean) {
    this.success = status;
  }
}
