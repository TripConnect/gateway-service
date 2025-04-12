import { Args, Context, ID, Query, Resolver } from "@nestjs/graphql";
import { User } from "./models/user.model";
import { UserService } from "./user.service";
import { FindUserRequest } from "common-utils/protos/defs/user_service_pb";
import { GatewayContext } from "src/app.module";

@Resolver()
export class UserResolver {

    constructor(
        private userService: UserService,
    ) { }

    @Query(() => User)
    async find(@Args('id', { type: () => ID }) id: string): Promise<User> {
        let req = new FindUserRequest()
            .setUserId(id);
        let user = await this.userService.findUser(req);
        return user;
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

}