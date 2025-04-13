import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";
import { FindUserRequest } from "common-utils/protos/defs/user_service_pb";
import { GatewayContext } from "src/app.module";
import { Settings } from "./models/settings.model";
import { TwofaService } from "./twofa.service";
import { Generate2faRequest, Create2faRequest } from "common-utils/protos/defs/twofa_service_pb";
import { UserService } from "src/user/user.service";
import { ResponseModel } from "src/common/models/response.model";

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
        @Args('secret', { type: () => String }) secret: string,
        @Args('otp', { type: () => String }) otp: string,
        @Context() context: GatewayContext
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
