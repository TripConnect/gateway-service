const grpc = require('@grpc/grpc-js');

import { backendProto } from 'common-utils';
import DiscoveryService from './discoveryService';

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

    private static stub = null;

    private static async getStub(): Promise<any> {
        if (!ChatService.stub) {
            let serviceInstance = await DiscoveryService.discover({ serviceName: "chat-service" });
            ChatService.stub = new backendProto.chat_service.ChatService(
                `${serviceInstance.host}:${serviceInstance.port}`,
                grpc.credentials.createInsecure());
        }

        return ChatService.stub;
    }

    public static async createConversation(
        { ownerId, name, type, memberIds }: { ownerId: string, name: string, type: string, memberIds: string[] }): Promise<Conversation> {
        let stub = await ChatService.getStub();
        return new Promise((resolve, reject) => {
            stub.CreateConversation({ ownerId, name, type, memberIds }, (error: Error, result: Conversation) => {
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
        let stub = await ChatService.getStub();
        return new Promise((resolve, reject) => {
            stub.SearchConversations({
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
        let stub = await ChatService.getStub();
        return new Promise((resolve, reject) => {
            stub.FindConversation({
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
        let stub = await ChatService.getStub();
        return new Promise((resolve, reject) => {
            stub.CreateChatMessage({ conversationId, fromUserId, messageContent }, (error: Error, result: ChatMessage) => {
                if (error) reject(error);
                else resolve(result);
            });
        });
    }
}
