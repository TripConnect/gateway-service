import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";
import { FindUserRequest } from "node-proto-lib/protos/user_service_pb";
import { GatewayContext } from "src/app.module";
import { Settings } from "./models/graphql.model";
import { TwofaService } from "./twofa.service";
import { Generate2faRequest, Create2faRequest } from "node-proto-lib/protos/twofa_service_pb";
import { UserService } from "src/user/user.service";
import { ResponseModel } from "src/shared/models/response.model";

@Resolver()
export class TwofaResolver {

    constructor(
        private userService: UserService,
        private twofaService: TwofaService,
    ) { }

    @Mutation(() => Settings)
    async generate2FASecret(@Context() context: GatewayContext): Promise<Settings> {
        let user = await this.userService.findUser(new FindUserRequest().setUserId(context.currentUserId as string));
        let req = new Generate2faRequest()
            .setLabel(user.displayName);
        let settings = await this.twofaService.generateTwofaSecret(req);
        return settings;
    }

    @Mutation(() => ResponseModel)
    async enable2FA(
        @Context() context: GatewayContext,
        @Args('secret', { type: () => String }) secret: string,
        @Args('otp', { type: () => String }) otp: string,
    ): Promise<ResponseModel> {
        if (!context.currentUserId) {
            return new ResponseModel(false);
        }

        let user = await this.userService.findUser(new FindUserRequest().setUserId(context.currentUserId as string));

        let req = new Create2faRequest()
            .setResourceId(user.id)
            .setSecret(secret)
            .setOtp(otp)
            .setLabel(user.displayName);
        let response = await this.twofaService.enableTwofa(req);
        return response;
    }
}
