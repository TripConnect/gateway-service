import { Injectable } from '@nestjs/common';
import {
  FindUserRequest,
  GetUsersRequest,
  SearchUserRequest,
  SignInRequest,
  SignUpRequest,
} from 'node-proto-lib/protos/user_service_pb';
import { UserServiceClient } from 'node-proto-lib/protos/user_service_grpc_pb';
import { ConfigService } from '@nestjs/config';
import { AuthUser, Self, User } from 'src/user/models/graphql.model';
import * as grpc from '@grpc/grpc-js';

@Injectable()
export class UserService {
  private userClient: UserServiceClient;

  constructor(private configService: ConfigService) {
    this.userClient = new UserServiceClient(
      this.configService.get<string>(
        'service-contact.user-service.address',
      ) as string,
      grpc.credentials.createInsecure(),
    );
  }

  async signUp(req: SignUpRequest): Promise<AuthUser> {
    return new Promise((resolve, reject) => {
      this.userClient.signUp(req, (error, userInfo) => {
        if (error) reject(error);
        else resolve(AuthUser.fromGrpcAuthInfo(userInfo));
      });
    });
  }

  async signIn(req: SignInRequest): Promise<AuthUser> {
    return new Promise((resolve, reject) => {
      this.userClient.signIn(req, (error, userInfo) => {
        if (error) reject(error);
        else resolve(AuthUser.fromGrpcAuthInfo(userInfo));
      });
    });
  }

  async findUser(req: FindUserRequest): Promise<User> {
    return new Promise((resolve, reject) => {
      this.userClient.findUser(req, (error, userInfo) => {
        if (error) reject(error);
        else resolve(User.fromGrpcUserInfo(userInfo));
      });
    });
  }

  async getSelf(req: FindUserRequest): Promise<Self> {
    return new Promise((resolve, reject) => {
      this.userClient.findUser(req, (error, userInfo) => {
        if (error) reject(error);
        else resolve(Self.fromGrpcUserInfo(userInfo));
      });
    });
  }

  async searchUsers(req: SearchUserRequest): Promise<User[]> {
    return new Promise((resolve, reject) => {
      this.userClient.searchUser(req, (error, usersInfo) => {
        if (error) reject(error);
        else
          resolve(
            usersInfo
              .getUsersList()
              .map((userInfo) => User.fromGrpcUserInfo(userInfo)),
          );
      });
    });
  }

  async getUsers(req: GetUsersRequest): Promise<User[]> {
    return new Promise((resolve, reject) => {
      this.userClient.getUsers(req, (error, usersInfo) => {
        if (error) reject(error);
        else
          resolve(
            usersInfo
              .getUsersList()
              .map((userInfo) => User.fromGrpcUserInfo(userInfo)),
          );
      });
    });
  }
}
