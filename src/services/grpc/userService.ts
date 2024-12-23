const grpc = require('@grpc/grpc-js');

import { backendProto } from 'common-utils';

export type GrpcToken = {
    access_token: string;
    refresh_token: string;
}

export type Token = {
    accessToken: string;
    refreshToken: string;
}

export type GrpcUserInfo = {
    // public area
    id: string;
    avatar: string | null;
    display_name: string;
    // private area
    enabled_2fa: boolean;
}

export type UserInfo = {
    // public area
    id: string;
    avatar: string | null;
    displayName: string;
    // private area
    enabled2fa: boolean;
}

export type GrpcAuthPayload = {
    user_info: GrpcUserInfo;
    token: GrpcToken;
}

export type AuthPayload = {
    userInfo: UserInfo;
    token: Token;
}

export default class UserService {
    private static stub = new backendProto.user_service.User(
        process.env.ROUTE_USER_SERVICE || 'localhost:31072',
        grpc.credentials.createInsecure());

    public static async signin(
        { username, password }: { username: string, password: string }): Promise<AuthPayload> {
        return new Promise((resolve, reject) => {
            UserService.stub.SignIn({ username, password }, (error: Error, result: GrpcAuthPayload) => {
                if (error) reject(error);
                else resolve({
                    token: {
                        accessToken: result.token.access_token,
                        refreshToken: result.token.refresh_token
                    },
                    userInfo: {
                        id: result.user_info.id,
                        avatar: result.user_info.avatar,
                        displayName: result.user_info.display_name,
                        enabled2fa: result.user_info.enabled_2fa
                    }
                });
            });
        });
    }

    public static async signup(
        { username, password, displayName, avatarURL }: { username: string, password: string, displayName: string, avatarURL: string | null }): Promise<AuthPayload> {
        return new Promise((resolve, reject) => {
            UserService.stub.SignUp({ username, password, displayName, avatarURL }, (error: any, result: GrpcAuthPayload) => {
                if (error) reject(error);
                else resolve({
                    token: {
                        accessToken: result.token.access_token,
                        refreshToken: result.token.refresh_token
                    },
                    userInfo: {
                        id: result.user_info.id,
                        avatar: result.user_info.avatar,
                        displayName: result.user_info.display_name,
                        enabled2fa: result.user_info.enabled_2fa
                    }
                });
            });
        });
    }

    public static async findUser(
        { userId }: { userId: string }): Promise<UserInfo> {
        return new Promise((resolve, reject) => {
            UserService.stub.FindUser({ userId }, (error: any, user: GrpcUserInfo) => {
                if (error) reject(error);
                else resolve({
                    id: user.id,
                    avatar: user.avatar,
                    displayName: user.display_name,
                    enabled2fa: user.enabled_2fa
                });
            });
        });
    }

    public static async searchUser(
        { term = '' }: { term?: string }): Promise<UserInfo[]> {
        return new Promise((resolve, reject) => {
            UserService.stub.SearchUser({ term }, (error: any, result: { users: GrpcUserInfo[] }) => {
                if (error) reject(error);
                else resolve(result.users.map(user => ({
                    id: user.id,
                    avatar: user.avatar,
                    displayName: user.display_name,
                    enabled2fa: user.enabled_2fa
                })));
            });
        });
    }

    public static async getUsers(
        { userIds }: { userIds: string[] }): Promise<UserInfo[]> {
        return new Promise((resolve, reject) => {
            UserService.stub.GetUsers({ userIds }, (error: any, result: { users: GrpcUserInfo[] }) => {
                if (error) reject(error);
                else resolve(result.users.map(user => ({
                    id: user.id,
                    avatar: user.avatar,
                    displayName: user.display_name,
                    enabled2fa: user.enabled_2fa
                })));
            });
        });
    }
}
