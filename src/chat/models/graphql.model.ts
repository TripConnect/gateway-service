import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  ConversationType,
  Conversation as GrpcConversation,
  ChatMessage as GrpcChatMessage,
  CreateChatMessageAck as GrpcCreateChatMessageAck,
} from 'node-proto-lib/protos/chat_service_pb';
import { User } from 'src/user/models/graphql.model';

registerEnumType(ConversationType, {
  name: 'ConversationType',
  description: 'Type of conversation',
});

@ObjectType()
export class Conversation {
  constructor(init?: Partial<Conversation>) {
    Object.assign(this, init);
  }

  @Field((type) => ID)
  id: string;

  @Field()
  name: string;

  @Field((type) => [User])
  members: User[];

  @Field((type) => [Message])
  messages: Message[];

  @Field(() => ConversationType)
  type: ConversationType;

  @Field(() => User)
  createdBy: User;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  lastMessageAt?: Date;

  static fromGrpcConversation(message: GrpcConversation): Conversation {
    const conversation = new Conversation();
    conversation.id = message.getId();
    conversation.name = message.getName();
    conversation.members = message.getMemberIdsList().map((userId) => {
      const user = new User();
      user.id = userId;
      return user;
    });
    conversation.type = message.getType(); // TODO: Check whether that return enum name
    conversation.createdBy = new User(); // TODO: Lazy fetching by UserService
    conversation.createdAt = message.getCreatedAt()!.toDate(); // FIXME: Change client side for number type
    conversation.lastMessageAt = new Date(); // FIXME: Adding to chat proto
    return conversation;
  }
}

@ObjectType()
export class Message {
  constructor(init?: Partial<Message>) {
    Object.assign(this, init);
  }

  @Field((type) => ID)
  id: string;

  @Field()
  conversation: Conversation;

  @Field()
  fromUser: User;

  @Field()
  content: string;

  @Field()
  sentTime: Date;

  @Field()
  createdAt: Date;

  static fromGrpcMessage(grpcMessage: GrpcChatMessage): Message {
    const message = new Message();
    message.id = grpcMessage.getId();
    message.content = grpcMessage.getContent();
    message.sentTime = grpcMessage.getSentTime()!.toDate();
    message.createdAt = grpcMessage.getCreateTime()!.toDate();
    message.fromUser = new User({
      id: grpcMessage.getFromUserId(),
    });

    return message;
  }
}

@ObjectType()
export class SendMessageAck {
  constructor(init?: Partial<SendMessageAck>) {
    Object.assign(this, init);
  }

  @Field()
  messageId: string;

  static fromGrpcMessage(
    grpcMessage: GrpcCreateChatMessageAck,
  ): SendMessageAck {
    return new SendMessageAck({
      messageId: grpcMessage.getCorrelationId(), // TODO: Rename field to MessageId
    });
  }
}
