import { Args, Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
    ConversationType,
    Conversation as GrpcConversation,
    ChatMessage as GrpcChatMessage,
} from 'node-proto-lib/protos/chat_service_pb';
import { User } from 'src/user/models/graphql.model';

registerEnumType(ConversationType, {
    name: "ConversationType",
    description: 'Type of conversation',
});

@ObjectType()
export class Conversation {

    constructor(init?: Partial<User>) {
        Object.assign(this, init);
    }

    @Field(type => ID)
    id: string;

    @Field()
    name: string;

    @Field(type => [User])
    members: User[]

    @Field(type => [Message])
    messages: Message[]

    @Field(() => ConversationType)
    type: ConversationType

    @Field(() => User)
    createdBy: User

    @Field()
    createdAt: Date

    @Field({ nullable: true })
    lastMessageAt?: Date

    static fromGrpcConversation(message: GrpcConversation): Conversation {
        let conversation = new Conversation();
        conversation.id = message.getId();
        conversation.name = message.getName();
        conversation.members = message.getMemberIdsList().map(userId => {
            let user = new User();
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

    @Field(type => ID)
    id: string;

    @Field()
    conversation: Conversation;

    @Field()
    fromUser: User;

    @Field()
    content: string

    @Field()
    createdAt: Date

    static fromGrpcMessage(grpcMessage: GrpcChatMessage): Message {
        let message = new Message();
        message.id = grpcMessage.getId();
        message.content = grpcMessage.getContent();
        message.createdAt = grpcMessage.getCreatedAt()!.toDate();
        message.fromUser = new User({
            id: grpcMessage.getFromUserId(),
        });

        return message;
    }
}
