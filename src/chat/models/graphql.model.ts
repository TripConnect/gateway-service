import { Args, Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
    ConversationType,
    Conversation as GrpcConversation,
    ChatMessage as GrpcChatMessage,
} from 'common-utils/protos/defs/chat_service_pb';
import { User } from 'src/user/models/graphql.model';

registerEnumType(ConversationType, {
    name: "ConversationType",
    description: 'Type of conversation',
});

@ObjectType()
export class Conversation {

    @Field(type => ID)
    id: string;

    @Field()
    name: string;

    @Field(type => [User])
    members: User[]

    @Field(type => [Message])
    messages(
        @Args('messagePageNumber', { type: () => Int, defaultValue: 0 }) messagePageNumber: number,
        @Args('messagePageSize', { type: () => Int, defaultValue: 20 }) messagePageSize: number,
    ): Message[] {
        // TODO: Implement by ChatService
        return [];
    }

    @Field(() => ConversationType)
    type: ConversationType

    @Field(() => User)
    createdBy: User

    @Field()
    createdAt: Date

    @Field({ nullable: true })
    lastMessageAt: Date

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

    static fromGrpcMessage(message: GrpcChatMessage): Message {
        let conversation = new Message();
        conversation.id = message.getId();
        conversation.content = message.getContent();
        conversation.createdAt = message.getCreatedAt()!.toDate();
        return conversation;
    }
}
