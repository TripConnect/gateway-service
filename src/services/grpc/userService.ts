const grpc = require('@grpc/grpc-js');

import { backendProto } from 'common-utils';
import DiscoveryService from './discoveryService';

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

    private static stub = null;

    private static async getStub(): Promise<any> {
        if (!UserService.stub) {
            let serviceInstance = await DiscoveryService.discover({ serviceName: "user-service" });
            UserService.stub = new backendProto.user_service.UserService(
                `${serviceInstance.host}:${serviceInstance.port}`,
                grpc.credentials.createInsecure());
        }

        return UserService.stub;
    }

    public static async signin(
        { username, password }: { username: string, password: string }): Promise<AuthPayload> {
        let stub = await UserService.getStub();
        return new Promise((resolve, reject) => {
            stub.SignIn({ username, password }, (error: Error, result: AuthPayload) => {
                if (error) reject(error);
                else resolve(result);
            });
        });
    }

    public static async signup(
        { username, password, displayName, avatarUrl }: { username: string, password: string, displayName: string, avatarUrl: string | null }): Promise<AuthPayload> {
        let stub = await UserService.getStub();
        return new Promise((resolve, reject) => {
            stub.SignUp({ username, password, displayName, avatarUrl }, (error: any, result: AuthPayload) => {
                if (error) reject(error);
                else resolve(result);
            });
        });
    }

    public static async findUser(
        { userId }: { userId: string }): Promise<UserInfo> {
        let stub = await UserService.getStub();
        return new Promise((resolve, reject) => {
            stub.FindUser({ userId }, (error: any, user: UserInfo) => {
                if (error) reject(error);
                else resolve(user);
            });
        });
    }

    public static async searchUser(
        { term = '' }: { term?: string }): Promise<UserInfo[]> {
        let stub = await UserService.getStub();
        return new Promise((resolve, reject) => {
            stub.SearchUser({ term }, (error: any, result: { users: UserInfo[] }) => {
                if (error) reject(error);
                else resolve(result.users);
            });
        });
    }

    public static async getUsers(
        { userIds }: { userIds: string[] }): Promise<UserInfo[]> {
        let stub = await UserService.getStub();
        return new Promise((resolve, reject) => {
            stub.GetUsers({ userIds }, (error: any, result: { users: UserInfo[] }) => {
                if (error) reject(error);
                else resolve(result.users);
            });
        });
    }
}
