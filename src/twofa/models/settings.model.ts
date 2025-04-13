
import { Field, ObjectType } from '@nestjs/graphql';
import { Generate2faResponse } from 'common-utils/protos/defs/twofa_service_pb';

@ObjectType()
export class Settings {

    @Field()
    secret: string;

    @Field()
    qrCode: string;

    static fromGenerateResponse(from: Generate2faResponse): Settings {
        let settings = new Settings();
        settings.secret = from.getSecret();
        settings.qrCode = from.getQrCode();
        return settings;
    }

}
