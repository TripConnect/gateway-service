import { Field, ID, ObjectType } from '@nestjs/graphql';
import { AuthenticatedInfo, UserInfo, Token as GrpcToken } from 'common-utils/protos/defs/user_service_pb';

@ObjectType()
export class User {

    @Field(type => ID)
    id: string;

    @Field()
    displayName: string;

    @Field({ nullable: true })
    avatar: string;

    @Field()
    enabledTwofa: boolean;

    static fromGrpcUserInfo(message?: UserInfo): User {
        if (!message) {
            return new User();
        }

        let user = new User();
        user.id = message.getId();
        user.displayName = message.getDisplayName();
        user.avatar = message.getAvatar();
        user.enabledTwofa = message.getEnabledTwofa();
        return user;
    }
}

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
