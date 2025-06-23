import { Injectable } from '@nestjs/common';
import * as grpc from '@grpc/grpc-js';
import {
    SignInRequest,
    FindUserRequest,
    SearchUserRequest,
    GetUsersRequest,
} from 'node-proto-lib/protos/user_service_pb';
import { UserServiceClient } from 'node-proto-lib/protos/user_service_grpc_pb';
import { DiscoveryServiceClient } from 'node-proto-lib/protos/discovery_service_grpc_pb';
import { DiscoveryRequest } from 'node-proto-lib/protos/discovery_service_pb';
import { ConfigService } from '@nestjs/config';
import { AuthUser, User } from './models/graphql.model';


@Injectable()
export class UserService {

    private static userClient: UserServiceClient;

    constructor(
        private configService: ConfigService,
    ) { }

    private async getUserClient(): Promise<UserServiceClient> {
        if (UserService.userClient) return UserService.userClient;

        return new Promise((resolve, reject) => {
            let discoveryClient = new DiscoveryServiceClient(
                this.configService.get<string>("discovery.address") as string, grpc.credentials.createInsecure());
            let discoverRequest = new DiscoveryRequest()
                .setServiceName("user-service");
            discoveryClient.discover(discoverRequest, (error, resp) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(new UserServiceClient(`${resp.getHost()}:${resp.getPort()}`, grpc.credentials.createInsecure()));
                }
            });
        });
    }

    async signIn(req: SignInRequest): Promise<AuthUser> {
        let userClient = await this.getUserClient();

        return new Promise((resolve, reject) => {
            userClient.signIn(req, (error, userInfo) => {
                if (error) reject(error);
                else resolve(AuthUser.fromGrpcAuthInfo(userInfo));
            });
        });
    }

    async findUser(req: FindUserRequest): Promise<User> {
        let userClient = await this.getUserClient();

        return new Promise((resolve, reject) => {
            userClient.findUser(req, (error, userInfo) => {
                if (error) reject(error);
                else resolve(User.fromGrpcUserInfo(userInfo));
            });
        });
    }

    async searchUsers(req: SearchUserRequest): Promise<User[]> {
        let userClient = await this.getUserClient();

        return new Promise((resolve, reject) => {
            userClient.searchUser(req, (error, usersInfo) => {
                if (error) reject(error);
                else resolve(usersInfo.getUsersList().map(userInfo => User.fromGrpcUserInfo(userInfo)));
            });
        });
    }

    async getUsers(req: GetUsersRequest): Promise<User[]> {
        let userClient = await this.getUserClient();

        return new Promise((resolve, reject) => {
            userClient.getUsers(req, (error, usersInfo) => {
                if (error) reject(error);
                else resolve(usersInfo.getUsersList().map(userInfo => User.fromGrpcUserInfo(userInfo)));
            });
        });
    }
}
