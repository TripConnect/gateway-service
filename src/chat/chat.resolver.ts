import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";
import { FindUserRequest } from "common-utils/protos/defs/user_service_pb";
import { GatewayContext } from "src/app.module";
import { Generate2faRequest, Create2faRequest } from "common-utils/protos/defs/twofa_service_pb";
import { UserService } from "src/user/user.service";
import { ResponseModel } from "src/shared/models/response.model";
import { ChatService } from "./chat.service";
import { Conversation } from "./models/graphql.model";
import { CreateConversationRequest } from "common-utils/protos/defs/chat_service_pb";

@Resolver()
export class ChatResolver {

    constructor(
        private chatService: ChatService,
    ) { }

    // async createConversation(
    //     @Context() context: GatewayContext,
    //     @Args('secret', { type: () => String }) secret: string,
    // ): Promise<Conversation> {
    //     let req = new CreateConversationRequest()
    //         .setMemberIdsList()
    //     this.chatService.createConversation()
    // }

}
