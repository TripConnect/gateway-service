const grpc = require('@grpc/grpc-js');

import { backendProto } from 'common-utils';

export type Token = {
    accessToken: string;
    refreshToken: string;
}

export type UserInfo = {
    // public area
    id: string;
    avatar: string | null;
    displayName: string;
    // private area
    enabledTwofa: boolean;
}

export type AuthPayload = {
    userInfo: UserInfo;
    token: Token;
}

export default class UserService {
    private static stub = new backendProto.user_service.UserService(
        process.env.ROUTE_USER_SERVICE || 'localhost:31072',
        grpc.credentials.createInsecure());

    public static async signin(
        { username, password }: { username: string, password: string }): Promise<AuthPayload> {
        return new Promise((resolve, reject) => {
            UserService.stub.SignIn({ username, password }, (error: Error, result: AuthPayload) => {
                if (error) reject(error);
                else resolve(result);
            });
        });
    }

    public static async signup(
        { username, password, displayName, avatarURL }: { username: string, password: string, displayName: string, avatarURL: string | null }): Promise<AuthPayload> {
        return new Promise((resolve, reject) => {
            UserService.stub.SignUp({ username, password, displayName, avatarURL }, (error: any, result: AuthPayload) => {
                if (error) reject(error);
                else resolve(result);
            });
        });
    }

    public static async findUser(
        { userId }: { userId: string }): Promise<UserInfo> {
        return new Promise((resolve, reject) => {
            UserService.stub.FindUser({ userId }, (error: any, user: UserInfo) => {
                console.log(user);
                if (error) reject(error);
                else resolve(user);
            });
        });
    }

    public static async searchUser(
        { term = '' }: { term?: string }): Promise<UserInfo[]> {
        return new Promise((resolve, reject) => {
            UserService.stub.SearchUser({ term }, (error: any, result: { users: UserInfo[] }) => {
                if (error) reject(error);
                else resolve(result.users);
            });
        });
    }

    public static async getUsers(
        { userIds }: { userIds: string[] }): Promise<UserInfo[]> {
        return new Promise((resolve, reject) => {
            UserService.stub.GetUsers({ userIds }, (error: any, result: { users: UserInfo[] }) => {
                if (error) reject(error);
                else resolve(result.users);
            });
        });
    }
}
