
import { Field, ObjectType } from '@nestjs/graphql';
import { Validate2faResponse } from 'common-utils/protos/defs/twofa_service_pb';

@ObjectType()
export class Validation {

    @Field()
    success: boolean;

    @Field()
    status: string;

    static fromGrpcValidation(message: Validate2faResponse): Validation {
        let validation = new Validation();
        validation.success = message.getSuccess();
        validation.status = message.getStatus();
        return validation;
    }

}
