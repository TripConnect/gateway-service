
import { Field, ObjectType } from '@nestjs/graphql';
import { Token as GrpcToken } from 'common-utils/protos/defs/user_service_pb';

@ObjectType()
export class Token {

    @Field()
    accessToken: string;

    @Field()
    refreshToken: string;

    public static fromGrpcToken(message?: GrpcToken): Token {
        if (!message) {
            return new Token();
        }

        let token = new Token();
        token.accessToken = message.getAccessToken();
        token.refreshToken = message.getRefreshToken();
        return token;
    }
}
