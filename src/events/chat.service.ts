import * as grpc from '@grpc/grpc-js';
import { Injectable } from "@nestjs/common";
import { ConfigService } from '@nestjs/config';
import { DiscoveryServiceClient } from "common-utils/protos/defs/discovery_service_grpc_pb";
import { DiscoveryRequest } from "common-utils/protos/defs/discovery_service_pb";
import { ChatServiceClient } from 'common-utils/protos/defs/chat_service_grpc_pb';
import {
    ChatMessage,
    Conversation,
    CreateConversationRequest,
    FindConversationRequest,
    SearchConversationsRequest,
    CreateChatMessageRequest,
} from 'common-utils/protos/defs/chat_service_pb';

@Injectable()
export class ChatService {

    private static chatClient: ChatServiceClient;

    constructor(
        private configService: ConfigService,
    ) { }

    private async getChatClient(): Promise<ChatServiceClient> {
        if (ChatService.chatClient) return ChatService.chatClient;

        return new Promise((resolve, reject) => {
            let discoveryClient = new DiscoveryServiceClient(
                this.configService.get<string>("discovery.address") as string, grpc.credentials.createInsecure());
            let discoverRequest = new DiscoveryRequest()
                .setServiceName("chat-service");
            discoveryClient.discover(discoverRequest, (error, resp) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(new ChatServiceClient(`${resp.getHost()}:${resp.getPort()}`, grpc.credentials.createInsecure()));
                }
            });
        });
    }

    async createConversation(req: CreateConversationRequest): Promise<Conversation> {
        let chatClient = await this.getChatClient();

        return new Promise((resolve, reject) => {
            chatClient.createConversation(req, (error, conversation) => {
                if (error) reject(error);
                else resolve(conversation);
            });
        });
    }

    async searchConversations(req: SearchConversationsRequest): Promise<Conversation[]> {
        let chatClient = await this.getChatClient();

        return new Promise((resolve, reject) => {
            chatClient.searchConversations(req, (error, result) => {
                if (error) reject(error);
                else resolve(result.getConversationsList());
            });
        });
    }

    async findConversation(req: FindConversationRequest): Promise<Conversation> {
        let chatClient = await this.getChatClient();

        return new Promise((resolve, reject) => {
            chatClient.findConversation(req, (error, conversation) => {
                if (error) reject(error);
                else resolve(conversation);
            });
        });
    }

    async createChatMessage(req: CreateChatMessageRequest): Promise<ChatMessage> {
        let chatClient = await this.getChatClient();
        return new Promise((resolve, reject) => {
            chatClient.createChatMessage(req, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            });
        });
    }
}
