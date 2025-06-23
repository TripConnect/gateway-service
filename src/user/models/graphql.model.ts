import { Field, ID, ObjectType } from '@nestjs/graphql';
import { AuthenticatedInfo, UserInfo, Token as GrpcToken } from 'node-proto-lib/protos/user_service_pb';

@ObjectType()
export class Self {

    constructor(init?: Partial<Self>) {
        Object.assign(this, init);
    }

    @Field(type => ID)
    id: string;

    @Field()
    displayName: string;

    // TODO: Using default avatar url at user-service
    @Field({ nullable: true })
    avatar?: string;

    @Field()
    enabledTwofa: boolean;

    static fromGrpcUserInfo(grpcUserInfo: UserInfo): Self {
        return new Self({
            id: grpcUserInfo.getId(),
            displayName: grpcUserInfo.getDisplayName(),
            avatar: grpcUserInfo.getAvatar(),
            enabledTwofa: grpcUserInfo.getEnabledTwofa(),
        });
    }
}

@ObjectType()
export class User {

    constructor(init?: Partial<User>) {
        Object.assign(this, init);
    }

    @Field(type => ID)
    id: string;

    @Field()
    displayName: string;

    // TODO: Using default avatar url at user-service
    @Field({ nullable: true })
    avatar?: string;

    static fromGrpcUserInfo(grpcUserInfo: UserInfo): User {
        return new User({
            id: grpcUserInfo.getId(),
            displayName: grpcUserInfo.getDisplayName(),
            avatar: grpcUserInfo.getAvatar(),
        });
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

    constructor(init?: Partial<AuthUser>) {
        Object.assign(this, init);
    }

    @Field({ nullable: true })
    userInfo?: Self;

    @Field({ nullable: true })
    token?: Token;

    public static fromGrpcAuthInfo(authenticatedInfo: AuthenticatedInfo): AuthUser {
        return new AuthUser({
            userInfo: authenticatedInfo.getUserInfo() ? Self.fromGrpcUserInfo(authenticatedInfo.getUserInfo() as UserInfo) : undefined,
            token: authenticatedInfo.getToken() ? Token.fromGrpcToken(authenticatedInfo.getToken()) : undefined,
        });
    }
}
