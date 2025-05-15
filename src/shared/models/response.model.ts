import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ResponseModel {

    @Field()
    status: boolean;

    constructor(status: boolean) {
        this.status = status;
    }
}
