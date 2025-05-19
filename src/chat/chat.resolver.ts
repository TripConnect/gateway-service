import { Args, Context, Mutation, Resolver, registerEnumType } from "@nestjs/graphql";
import { FindUserRequest } from "common-utils/protos/defs/user_service_pb";
import { GatewayContext } from "src/app.module";
import { Generate2faRequest, Create2faRequest } from "common-utils/protos/defs/twofa_service_pb";
import { UserService } from "src/user/user.service";
import { ResponseModel } from "src/shared/models/response.model";
import { ChatService } from "./chat.service";
import { Conversation } from "./models/graphql.model";
import { ConversationType, CreateConversationRequest } from "common-utils/protos/defs/chat_service_pb";

registerEnumType(ConversationType, {
    name: "ConversationType",
    description: 'Type of conversation',
});

@Resolver()
export class ChatResolver {

    constructor(
        private chatService: ChatService,
    ) { }

    async createConversation(
        @Context() context: GatewayContext,
        @Args('name', { type: () => String }) name: string,
        @Args('type', { type: () => ConversationType }) type: ConversationType,
        @Args('members', { type: () => String }) members: string,
    ): Promise<Conversation> {
        let req = new CreateConversationRequest()
            .setName(name)
            .setType(type)
            .setMemberIdsList(members.split(","))
            .setOwnerId(context.currentUserId as string);
        let conversation = this.chatService.createConversation(req);
        return conversation;
    }
}
