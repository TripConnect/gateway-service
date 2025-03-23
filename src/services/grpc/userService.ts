const grpc = require('@grpc/grpc-js');

import { backendProto } from 'common-utils';
import DiscoveryService from './discoveryService';
import logger from 'utils/logging';

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

    private static _stub = null;

    static {
        DiscoveryService.discover({ serviceName: "user-service" })
            .then(serviceInstance => {
                UserService._stub = new backendProto.user_service.UserService(
                    `${serviceInstance.host}:${serviceInstance.port}`,
                    grpc.credentials.createInsecure()
                );
            })
            .catch(error => {
                logger.error(error);
                logger.error("Failed to initialize gRPC stub");
            });
    }

    private static get STUB(): any {
        return UserService._stub;
    }

    public static async signin(
        { username, password }: { username: string, password: string }): Promise<AuthPayload> {
        return new Promise((resolve, reject) => {
            UserService.STUB.SignIn({ username, password }, (error: Error, result: AuthPayload) => {
                if (error) reject(error);
                else resolve(result);
            });
        });
    }

    public static async signup(
        { username, password, displayName, avatarUrl }: { username: string, password: string, displayName: string, avatarUrl: string | null }): Promise<AuthPayload> {
        return new Promise((resolve, reject) => {
            UserService.STUB.SignUp({ username, password, displayName, avatarUrl }, (error: any, result: AuthPayload) => {
                if (error) reject(error);
                else resolve(result);
            });
        });
    }

    public static async findUser(
        { userId }: { userId: string }): Promise<UserInfo> {
        return new Promise((resolve, reject) => {
            UserService.STUB.FindUser({ userId }, (error: any, user: UserInfo) => {
                if (error) reject(error);
                else resolve(user);
            });
        });
    }

    public static async searchUser(
        { term = '' }: { term?: string }): Promise<UserInfo[]> {
        return new Promise((resolve, reject) => {
            UserService.STUB.SearchUser({ term }, (error: any, result: { users: UserInfo[] }) => {
                if (error) reject(error);
                else resolve(result.users);
            });
        });
    }

    public static async getUsers(
        { userIds }: { userIds: string[] }): Promise<UserInfo[]> {
        return new Promise((resolve, reject) => {
            UserService.STUB.GetUsers({ userIds }, (error: any, result: { users: UserInfo[] }) => {
                if (error) reject(error);
                else resolve(result.users);
            });
        });
    }
}
