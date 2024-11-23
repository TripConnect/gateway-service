const grpc = require('@grpc/grpc-js');

import ServiceBase from "./serviceBase";

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

export default class ChatService extends ServiceBase {
    private static stub = new super.backendProto.Chat(
        process.env.ROUTE_CHAT_SERVICE, grpc.credentials.createInsecure());

    public static async createConversation(
        { ownerId, name, type, memberIds }: { ownerId: string, name: string, type: string, memberIds: string[] }): Promise<Conversation> {
        return new Promise((resolve, reject) => {
            ChatService.stub.CreateConversation({ ownerId, name, type, memberIds }, (error: Error, result: Conversation) => {
                if (error) reject(error);
                else resolve(result);
            });
        });
    }

    public static async searchConversations(
        { type = ConversationType.PRIVATE, memberIds = [] as string[], term = "", page = 1, limit = 50, messageLimit = 10 }): Promise<Conversation[]> {
        return new Promise((resolve, reject) => {
            ChatService.stub.SearchConversations({ type, memberIds, term, page, limit, messageLimit }, (error: Error, result: { conversations: Conversation[] }) => {
                if (error) reject(error);
                else resolve(result.conversations);
            });
        });
    }

    public static async findConversation(
        { conversationId, messagePage = 1, messageLimit = 1 }: { conversationId: string, messagePage?: number, messageLimit?: number }): Promise<Conversation> {
        return new Promise((resolve, reject) => {
            ChatService.stub.FindConversation({ conversationId, messagePage, messageLimit }, (error: Error, result: Conversation) => {
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
