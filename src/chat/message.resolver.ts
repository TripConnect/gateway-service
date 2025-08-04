import {
  Args,
  Context,
  ID,
  Mutation,
  Parent,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { User } from 'src/user/models/graphql.model';
import { Message, SendMessageAck } from 'src/chat/models/graphql.model';
import { UserService } from 'src/user/user.service';
import { FindUserRequest } from 'node-proto-lib/protos/user_service_pb';
import { GatewayContext } from '../app.module';
import { CreateChatMessageRequest } from 'node-proto-lib/protos/chat_service_pb';
import { ChatService } from './chat.service';

@Resolver(() => Message)
export class MessageResolver {
  constructor(
    private readonly userService: UserService,
    private readonly chatService: ChatService,
  ) {}

  @ResolveField(() => User)
  async fromUser(@Parent() message: Message): Promise<User> {
    const req = new FindUserRequest().setUserId(message.fromUser.id);
    return await this.userService.findUser(req);
  }

  @Mutation(() => SendMessageAck)
  async sendMessage(
    @Context() context: GatewayContext,
    @Args('conversation_id', { type: () => ID }) conversationId: string,
    @Args('content', { type: () => String }) content: string,
  ): Promise<SendMessageAck> {
    const req = new CreateChatMessageRequest()
      .setConversationId(conversationId)
      .setContent(content)
      .setFromUserId(context.currentUserId as string);
    return this.chatService.sendChatMessage(req);
  }
}
