
import { Args, Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { ConversationType, Conversation as GrpcConversation, ChatMessage as GqlChatMessage } from 'common-utils/protos/defs/chat_service_pb';
import { User } from 'src/user/models/user.model';

@ObjectType()
export class Conversation {

    @Field(type => ID)
    id: string;

    @Field()
    name: string;

    @Field(type => [User])
    members: User[]

    @Field(type => [GqlChatMessage])
    messages(
        @Args('messagePage', { type: () => Int }) messagePage: number,
        @Args('messageLimit', { type: () => Int }) messageLimit: number,
    ): GqlChatMessage[] {
        // TODO: Implement by UserService
        return [];
    }

    @Field(() => ConversationType)
    type: String

    @Field(() => User)
    createdBy: User

    @Field()
    createdAt: number

    @Field({ nullable: true })
    lastMessageAt: number

    static fromGrpcGeneration(message: GrpcConversation): Conversation {
        let conversation = new Conversation();
        conversation.id = message.getId();
        conversation.name = message.getName();
        conversation.members = message.getMemberIdsList().map(userId => new User()); // TODO: Lazy fetching by UserService
        conversation.type = message.getType().toString(); // TODO: Check whether that return enum name
        conversation.createdBy = new User(); // TODO: Lazy fetching by UserService
        conversation.createdAt = message.getCreatedAt()!.toDate().getMilliseconds(); // FIXME: Change client side for number type
        conversation.lastMessageAt = new Date().getMilliseconds(); // FIXME: Adding to chat proto
        return conversation;
    }
}
