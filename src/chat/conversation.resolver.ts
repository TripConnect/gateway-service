import { Args, Context, ID, Int, Mutation, Parent, ResolveField, Resolver, registerEnumType } from "@nestjs/graphql";
import { GatewayContext } from "src/app.module";
import { ChatService } from "./chat.service";
import { Conversation } from "./models/graphql.model";
import { ConversationType, CreateConversationRequest, FindConversationRequest } from "common-utils/protos/defs/chat_service_pb";
import { User } from "src/user/models/graphql.model";
import { UserService } from "src/user/user.service";
import { GetUsersRequest } from "common-utils/protos/defs/user_service_pb";
import { Query } from "@nestjs/graphql";

registerEnumType(ConversationType, {
    name: "ConversationType",
    description: 'Type of conversation',
});

@Resolver(() => Conversation)
export class ConversationResolver {

    constructor(
        private chatService: ChatService,
        private userService: UserService,
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

    @Query(() => Conversation)
    async conversation(
        @Args('id', { type: () => ID }) id: string,
        @Args('messagePageNumber', { type: () => Int, defaultValue: 0 }) messagePageNumber: number,
        @Args('messagePageSize', { type: () => Int, defaultValue: 20 }) messagePageSize: number
    ): Promise<Conversation> {
        let req = new FindConversationRequest()
            .setConversationId(id);
        let conversation = this.chatService.findConversation(req);
        return conversation;
    }

    @ResolveField(() => [User])
    async members(@Parent() conversation: Conversation): Promise<User[]> {
        let req = new GetUsersRequest()
            .setUserIdsList(conversation.members.map(m => m.id));
        const members = await this.userService.getUsers(req);
        return members;
    }
}
