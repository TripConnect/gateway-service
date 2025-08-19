import {
  Args,
  Context,
  ID,
  Int,
  Mutation,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { UserService } from './user.service';
import {
  FindUserRequest,
  SearchUserRequest,
  SignInRequest,
} from 'node-proto-lib/protos/user_service_pb';
import { GatewayContext } from 'src/app.module';
import { AuthUser, Self, User } from './models/graphql.model';
import { TwofaService } from 'src/twofa/twofa.service';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../guards/auth.guard';
import { StatusCode } from '../shared/status';
import { GraphQLError } from 'graphql';
import { Validate2faRequest } from 'node-proto-lib/protos/twofa_service_pb';

@Resolver()
export class UserResolver {
  constructor(
    private userService: UserService,
    private twofaService: TwofaService,
  ) {}

  @Mutation(() => AuthUser)
  async signIn(
    @Context() context: GatewayContext,
    @Args('username', { type: () => String }) username: string,
    @Args('password', { type: () => String }) password: string,
    @Args('otp', { type: () => String, nullable: true, defaultValue: '' })
    otp: string,
  ): Promise<AuthUser> {
    const req = new SignInRequest().setUsername(username).setPassword(password);
    const authenticatedInfo = await this.userService.signIn(req);

    if (authenticatedInfo.userInfo?.enabledTwofa) {
      const validateReq = new Validate2faRequest()
        .setResourceId(authenticatedInfo.userInfo.id)
        .setOtp(otp);
      const secondFactorResp =
        await this.twofaService.validateTwofa(validateReq);
      if (!secondFactorResp.success) {
        throw new GraphQLError('Two-factor authentication required', {
          extensions: {
            code: StatusCode.MULTI_FACTOR_REQUIRED,
          },
        });
      }
    }

    context.res.cookie('accessToken', authenticatedInfo.token.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });
    context.res.cookie('refreshToken', authenticatedInfo.token.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return authenticatedInfo;
  }

  @Query(() => Self)
  @UseGuards(GqlAuthGuard)
  async me(@Context() context: GatewayContext): Promise<Self> {
    const req = new FindUserRequest().setUserId(
      context.currentUserId as string,
    );
    return await this.userService.getSelf(req);
  }

  @Query(() => User)
  async user(@Args('id', { type: () => ID }) id: string): Promise<User> {
    const req = new FindUserRequest().setUserId(id);
    return await this.userService.findUser(req);
  }

  @Query(() => [User])
  async users(
    @Args('searchTerm', { type: () => String }) searchTerm: string,
    @Args('pageNumber', { type: () => Int, defaultValue: 0 }) page: number,
    @Args('pageSize', { type: () => Int, defaultValue: 20 }) limit: number,
  ): Promise<User[]> {
    const req = new SearchUserRequest()
      .setTerm(searchTerm)
      .setPageNumber(page)
      .setPageSize(limit);
    const user = await this.userService.searchUsers(req);
    return user;
  }
}
