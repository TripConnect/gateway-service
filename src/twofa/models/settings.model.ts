
import { Field, ObjectType } from '@nestjs/graphql';
import { Generate2faResponse } from 'common-utils/protos/defs/twofa_service_pb';

@ObjectType()
export class Settings {

    @Field()
    secret: string;

    @Field()
    qrCode: string;

    static fromGrpcGeneration(message: Generate2faResponse): Settings {
        let settings = new Settings();
        settings.secret = message.getSecret();
        settings.qrCode = message.getQrCode();
        return settings;
    }

}
