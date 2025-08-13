import {
  Args,
  Context,
  GraphQLISODateTime,
  ID,
  Int,
  Mutation,
  Parent,
  Query,
  registerEnumType,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { GatewayContext } from 'src/app.module';
import { ChatService } from './chat.service';
import { Conversation, Message } from './models/graphql.model';
import {
  ConversationType,
  CreateConversationRequest,
  FindConversationRequest,
  GetChatMessagesRequest,
} from 'node-proto-lib/protos/chat_service_pb';
import { User } from 'src/user/models/graphql.model';
import { UserService } from 'src/user/user.service';
import { GetUsersRequest } from 'node-proto-lib/protos/user_service_pb';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';

registerEnumType(ConversationType, {
  name: 'ConversationType',
  description: 'Type of conversation',
});

@Resolver(() => Conversation)
export class ConversationResolver {
  constructor(
    private chatService: ChatService,
    private userService: UserService,
  ) {}

  @Mutation(() => Conversation)
  async createConversation(
    @Context() context: GatewayContext,
    @Args('name', { type: () => String, nullable: true }) name: string,
    @Args('type', { type: () => ConversationType }) type: ConversationType,
    @Args('memberIds', { type: () => [String] }) members: string[],
  ): Promise<Conversation> {
    const req = new CreateConversationRequest()
      .setName(name)
      .setType(type)
      .setMemberIdsList(members)
      .setOwnerId(context.currentUserId as string);
    return this.chatService.createConversation(req);
  }

  @Query(() => Conversation)
  async conversation(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Conversation> {
    const req = new FindConversationRequest().setConversationId(id);
    return await this.chatService.findConversation(req);
  }

  @ResolveField(() => [User])
  async members(
    @Parent() conversation: Conversation,
    @Args('pageNumber', { type: () => Int }) pageNumber: number,
    @Args('pageSize', { type: () => Int }) pageSize: number,
  ): Promise<User[]> {
    // TODO: Get conv members with pagination
    const req = new GetUsersRequest().setUserIdsList(
      conversation.members.map((m) => m.id),
    );
    return await this.userService.getUsers(req);
  }

  @ResolveField(() => [Message])
  async messages(
    @Parent() conversation: Conversation,
    @Args('messageBefore', {
      type: () => GraphQLISODateTime,
      nullable: true,
    })
    messageBefore: Date,
    @Args('messageAfter', {
      type: () => GraphQLISODateTime,
      nullable: true,
    })
    messageAfter: Date,
    @Args('messageLimit', { type: () => Int }) messageLimit: number,
  ): Promise<Message[]> {
    const req = new GetChatMessagesRequest()
      .setConversationId(conversation.id)
      .setBefore(
        messageBefore ? Timestamp.fromDate(messageBefore) : undefined,
      )
      .setAfter(
        messageAfter ? Timestamp.fromDate(messageAfter) : undefined
      )
      .setLimit(messageLimit);
    return await this.chatService.getChatMessages(req);
  }
}
