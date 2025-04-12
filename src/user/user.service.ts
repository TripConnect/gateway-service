import { Injectable } from '@nestjs/common';
import * as grpc from '@grpc/grpc-js';
import {
    SignUpRequest,
    SignInRequest,
    FindUserRequest,
    GetUsersRequest,
    SearchUserRequest,
    AuthenticatedInfo,
    UserInfo,
} from 'common-utils/protos/defs/user_service_pb';
import { UserServiceClient } from 'common-utils/protos/defs/user_service_grpc_pb';
import { User } from './models/user.model';
import { DiscoveryServiceClient } from 'common-utils/protos/defs/discovery_service_grpc_pb';
import { DiscoveryRequest } from 'common-utils/protos/defs/discovery_service_pb';
import { ConfigHelper } from 'common-utils';


@Injectable()
export class UserService {

    private static userClient: UserServiceClient;

    private async getUserClient(): Promise<UserServiceClient> {
        if (UserService.userClient) return UserService.userClient;

        return new Promise((resolve, reject) => {
            let discoveryClient = new DiscoveryServiceClient(ConfigHelper.read("discovery.address"), grpc.credentials.createInsecure());
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

    async findUser(req: FindUserRequest): Promise<User> {
        let userClient = await this.getUserClient();

        return new Promise((resolve, reject) => {
            userClient.findUser(req, (error, userInfo) => {
                if (error) reject(error);
                else resolve(User.fromUserInfo(userInfo.toObject()));
            });
        });
    }
}
