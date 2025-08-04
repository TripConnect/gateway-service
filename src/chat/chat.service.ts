import * as grpc from '@grpc/grpc-js';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DiscoveryServiceClient } from 'node-proto-lib/protos/discovery_service_grpc_pb';
import { DiscoveryRequest } from 'node-proto-lib/protos/discovery_service_pb';
import { ChatServiceClient } from 'node-proto-lib/protos/chat_service_grpc_pb';
import {
  CreateConversationRequest,
  FindConversationRequest,
  SearchConversationsRequest,
  CreateChatMessageRequest,
  GetChatMessagesRequest,
} from 'node-proto-lib/protos/chat_service_pb';
import { Conversation, Message, SendMessageAck } from './models/graphql.model';

@Injectable()
export class ChatService {
  private static chatClient: ChatServiceClient;

  constructor(private configService: ConfigService) {}

  private async getChatClient(): Promise<ChatServiceClient> {
    if (ChatService.chatClient) return ChatService.chatClient;

    return new Promise((resolve, reject) => {
      const discoveryClient = new DiscoveryServiceClient(
        this.configService.get<string>('discovery.address') as string,
        grpc.credentials.createInsecure(),
      );
      const discoverRequest = new DiscoveryRequest().setServiceName(
        'chat-service',
      );
      discoveryClient.discover(discoverRequest, (error, resp) => {
        if (error) {
          reject(error);
        } else {
          resolve(
            new ChatServiceClient(
              `${resp.getHost()}:${resp.getPort()}`,
              grpc.credentials.createInsecure(),
            ),
          );
        }
      });
    });
  }

  async createConversation(
    req: CreateConversationRequest,
  ): Promise<Conversation> {
    const chatClient = await this.getChatClient();

    return new Promise((resolve, reject) => {
      chatClient.createConversation(req, (error, conversation) => {
        if (error) reject(error);
        else resolve(Conversation.fromGrpcConversation(conversation));
      });
    });
  }

  async searchConversations(
    req: SearchConversationsRequest,
  ): Promise<Conversation[]> {
    const chatClient = await this.getChatClient();

    return new Promise((resolve, reject) => {
      chatClient.searchConversations(req, (error, result) => {
        if (error) reject(error);
        else
          resolve(
            result
              .getConversationsList()
              .map((grpcConversation) =>
                Conversation.fromGrpcConversation(grpcConversation),
              ),
          );
      });
    });
  }

  async findConversation(req: FindConversationRequest): Promise<Conversation> {
    const chatClient = await this.getChatClient();

    return new Promise((resolve, reject) => {
      chatClient.findConversation(req, (error, conversation) => {
        if (error) reject(error);
        else resolve(Conversation.fromGrpcConversation(conversation));
      });
    });
  }

  async sendChatMessage(
    req: CreateChatMessageRequest,
  ): Promise<SendMessageAck> {
    const chatClient = await this.getChatClient();

    return new Promise((resolve, reject) => {
      chatClient.createChatMessage(req, (error, ack) => {
        if (error) reject(error);
        else resolve(SendMessageAck.fromGrpcMessage(ack));
      });
    });
  }

  async getChatMessages(req: GetChatMessagesRequest): Promise<Message[]> {
    const chatClient = await this.getChatClient();
    return new Promise((resolve, reject) => {
      chatClient.getChatMessages(req, (error, result) => {
        if (error) reject(error);
        else
          resolve(
            result
              .getMessagesList()
              .map((grpcMessage) => Message.fromGrpcMessage(grpcMessage)),
          );
      });
    });
  }
}
