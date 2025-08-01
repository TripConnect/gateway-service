import {
  Args,
  Context,
  GraphQLISODateTime,
  ID,
  Int,
  Mutation,
  Parent,
  ResolveField,
  Resolver,
  registerEnumType,
} from '@nestjs/graphql';
import { GatewayContext } from 'src/app.module';
import { ChatService } from './chat.service';
import { Conversation, Message } from './models/graphql.model';
import {
  ConversationType,
  CreateConversationRequest,
  FindConversationRequest,
} from 'node-proto-lib/protos/chat_service_pb';
import { User } from 'src/user/models/graphql.model';
import { UserService } from 'src/user/user.service';
import { GetUsersRequest } from 'node-proto-lib/protos//user_service_pb';
import { Query } from '@nestjs/graphql';
import { GetChatMessagesRequest } from 'node-proto-lib/protos/chat_service_pb';
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
    const conversation = this.chatService.createConversation(req);
    return conversation;
  }

  @Query(() => Conversation)
  async conversation(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Conversation> {
    const req = new FindConversationRequest().setConversationId(id);
    const conversation = await this.chatService.findConversation(req);
    return conversation;
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
    const members = await this.userService.getUsers(req);
    return members;
  }

  @ResolveField(() => [Message])
  async messages(
    @Parent() conversation: Conversation,
    @Args('messageBefore', { type: () => GraphQLISODateTime, nullable: true })
    messageBefore: Date,
    @Args('messageAfter', { type: () => GraphQLISODateTime, nullable: true })
    messageAfter: Date,
    @Args('messageLimit', { type: () => Int }) messageLimit: number,
  ): Promise<Message[]> {
    const req = new GetChatMessagesRequest()
      .setConversationId(conversation.id)
      .setBefore(messageBefore && new Timestamp().fromDate(messageBefore))
      .setAfter(messageAfter && new Timestamp().fromDate(messageAfter))
      .setLimit(messageLimit);
    const members = await this.chatService.getChatMessages(req);
    return members;
  }
}
