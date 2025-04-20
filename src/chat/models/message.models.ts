
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { ConversationType, Conversation as GrpcConversation, ChatMessage } from 'common-utils/protos/defs/chat_service_pb';
import { User } from 'src/user/models/user.model';
import { Conversation } from './conversation.model';

@ObjectType()
export class Message {
    @Field(type => ID)
    id: string;

    @Field()
    conversation: Conversation;

    @Field()
    fromUser: User;

    @Field()
    messageContent: string

    @Field()
    createdAt: number
}
