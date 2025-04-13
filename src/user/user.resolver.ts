import { Args, Context, ID, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { User } from "./models/user.model";
import { UserService } from "./user.service";
import { FindUserRequest, SearchUserRequest, SignInRequest } from "common-utils/protos/defs/user_service_pb";
import { GraphQLError } from 'graphql';
import { GatewayContext } from "src/app.module";
import { AuthUser } from "./models/authenticated.model";
import { TwofaService } from "src/twofa/twofa.service";
import { Validate2faRequest } from "common-utils/protos/defs/twofa_service_pb";
import { StatusCode } from "src/common/status";

@Resolver()
export class UserResolver {

    constructor(
        private userService: UserService,
        private twofaService: TwofaService,
    ) { }

    @Mutation(() => AuthUser)
    async signin(
        @Args('username', { type: () => String }) username: string,
        @Args('password', { type: () => String }) password: string,
        @Args('otp', { type: () => String, defaultValue: '' }) otp: string,
    ): Promise<AuthUser> {
        let req = new SignInRequest()
            .setUsername(username)
            .setPassword(password);
        let authenticatedInfo = await this.userService.signIn(req);

        if (!authenticatedInfo.userInfo?.enabledTwofa) return authenticatedInfo;

        let validateReq = new Validate2faRequest()
            .setResourceId(authenticatedInfo.userInfo.id)
            .setOtp(otp);

        let secondFactorResp = await this.twofaService.validateTwofa(validateReq);

        if (secondFactorResp.success) return authenticatedInfo;

        throw new GraphQLError("Two-factor authentication required", {
            extensions: {
                code: StatusCode.MULTI_FACTOR_REQUIRED,
            }
        });
    }

    @Query(() => User)
    async me(@Context() context: GatewayContext): Promise<User> {
        if (!context.currentUserId) {
            return new User();
        }

        let req = new FindUserRequest()
            .setUserId(context.currentUserId);
        let user = await this.userService.findUser(req);
        return user;
    }

    @Query(() => User)
    async user(@Args('id', { type: () => ID }) id: string): Promise<User> {
        let req = new FindUserRequest()
            .setUserId(id);
        let user = await this.userService.findUser(req);
        return user;
    }

    @Query(() => [User])
    async users(
        @Args('searchTerm', { type: () => String }) searchTerm: string,
        @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
        @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
    ): Promise<User[]> {
        let req = new SearchUserRequest()
            .setTerm(searchTerm)
            .setPageNumber(page)
            .setPageSize(limit);
        let user = await this.userService.searchUsers(req);
        return user;
    }
}
