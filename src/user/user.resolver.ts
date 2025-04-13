import { Args, Context, ID, Int, Query, Resolver } from "@nestjs/graphql";
import { User } from "./models/user.model";
import { UserService } from "./user.service";
import { FindUserRequest, SearchUserRequest } from "common-utils/protos/defs/user_service_pb";
import { GatewayContext } from "src/app.module";

@Resolver()
export class UserResolver {

    constructor(
        private userService: UserService,
    ) { }

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