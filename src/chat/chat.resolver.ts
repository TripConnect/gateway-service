import { Args, Context, Mutation, Resolver, registerEnumType } from "@nestjs/graphql";
import { GatewayContext } from "src/app.module";
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

    @Mutation(() => Conversation)
    async createConversation(
        @Context() context: GatewayContext,
        @Args('name', { type: () => String, nullable: true }) name: string,
        @Args('type', { type: () => ConversationType }) type: ConversationType,
        @Args('memberIds', { type: () => [String] }) members: string[],
    ): Promise<Conversation> {
        let req = new CreateConversationRequest()
            .setName(name)
            .setType(type)
            .setMemberIdsList(members)
            .setOwnerId(context.currentUserId as string);
        let conversation = this.chatService.createConversation(req);
        return conversation;
    }
}
