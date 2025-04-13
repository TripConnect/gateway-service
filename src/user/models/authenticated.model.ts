
import { Field, ObjectType } from '@nestjs/graphql';
import { AuthenticatedInfo } from 'common-utils/protos/defs/user_service_pb';
import { Token } from './token.model';
import { User } from './user.model';

@ObjectType()
export class AuthUser {

    @Field()
    userInfo: User;

    @Field()
    token: Token;

    public static fromGrpcAuthInfo(message: AuthenticatedInfo): AuthUser {
        let authUser = new AuthUser();
        authUser.userInfo = User.fromGrpcUserInfo(message.getUserInfo());
        authUser.token = Token.fromGrpcToken(message.getToken())
        return authUser;
    }
}
