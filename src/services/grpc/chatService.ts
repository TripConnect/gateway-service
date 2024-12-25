const grpc = require('@grpc/grpc-js');

import { backendProto } from 'common-utils';

export enum ConversationType {
    PRIVATE = 'PRIVATE',
    GROUP = 'GROUP',
}

export type ChatMessage = {
    id: string,
    conversationId: string,
    fromUserId: string,
    messageContent: string,
    createdAt: Date
}

export type Conversation = {
    id: string;
    type: ConversationType;
    name: string;
    memberIds: string[];
    messages: ChatMessage[];
    createdAt: Date;
}

export default class ChatService {
    private static stub = new backendProto.chat_service.ChatService(
        process.env.ROUTE_CHAT_SERVICE || 'localhost:31073',
        grpc.credentials.createInsecure());

    public static async createConversation(
        { ownerId, name, type, memberIds }: { ownerId: string, name: string, type: string, memberIds: string[] }): Promise<Conversation> {
        return new Promise((resolve, reject) => {
            ChatService.stub.CreateConversation({ ownerId, name, type, memberIds }, (error: Error, result: Conversation) => {
                if (error) reject(error);
                else resolve(result);
            });
        });
    }

    public static async searchConversations({
        type = ConversationType.PRIVATE,
        memberIds = [] as string[],
        term = "",
        page = 1,
        limit = 50,
        messageLimit = 10
    }): Promise<Conversation[]> {
        return new Promise((resolve, reject) => {
            ChatService.stub.SearchConversations({
                type,
                memberIds,
                term,
                page_number: page,
                page_size: limit,
                message_page_size: messageLimit
            }, (error: Error, result: { conversations: Conversation[] }) => {
                if (error) reject(error);
                else resolve(result.conversations);
            });
        });
    }

    public static async findConversation(
        {
            conversationId,
            messagePage = 1,
            messageLimit = 1
        }: {
            conversationId: string,
            messagePage?: number,
            messageLimit?: number
        }): Promise<Conversation> {
        return new Promise((resolve, reject) => {
            ChatService.stub.FindConversation({
                conversationId,
                message_page_number: messagePage,
                message_page_size: messageLimit
            }, (error: Error, result: Conversation) => {
                if (error) reject(error);
                else resolve(result);
            });
        });
    }

    public static async createChatMessage(
        { conversationId, fromUserId, messageContent }: { conversationId: string, fromUserId: string, messageContent: string }): Promise<ChatMessage> {
        return new Promise((resolve, reject) => {
            ChatService.stub.CreateChatMessage({ conversationId, fromUserId, messageContent }, (error: Error, result: ChatMessage) => {
                if (error) reject(error);
                else resolve(result);
            });
        });
    }
}
