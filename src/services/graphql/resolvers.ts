let grpc = require('@grpc/grpc-js');
const { GraphQLUpload } = require('graphql-upload-ts');
import { GraphQLError } from 'graphql';
import { v4 as uuidv4 } from 'uuid';
import { finished } from "stream/promises";

import UserService from "../grpc/userService";
import ChatService from "../grpc/chatService";
import { AuthenticatedRequest } from './middlewares';
import Trip from "../../database/models/trip";
import logger from "../../utils/logging";
import { StatusCode } from "../../utils/graphql";

const resolvers = {
    Upload: GraphQLUpload,
    Query: {
        status: async () => {
            return { status: true };
        },
        user: async (
            _: any,
            { user_id }: { user_id: string }
        ) => {
            let data = await UserService.findUser({ userId: user_id });
            return data;
        },
        users: async (
            _: any,
            { searchTerm }: { searchTerm: string },
            { currentUserId }: { currentUserId: string }
        ) => {
            let data = await UserService.searchUser({ term: searchTerm });
            return data.users;
        },
        conversations: AuthenticatedRequest(async (
            _: any,
            { page = 1, limit = 100, messageLimit = 10 }: { page: number, limit: number, messageLimit: number },
            { currentUserId }: { currentUserId: string }
        ) => {
            let result = [];
            let rpcConversations = await ChatService.searchConversations({ memberIds: [currentUserId], page, limit, messageLimit });
            for (let conversation of rpcConversations.conversations) {
                let rpcMembers = await UserService.getUsers({ userIds: conversation.memberIds });

                result.push({
                    id: conversation.id,
                    name: conversation.name,
                    type: conversation.type,
                    createdBy: null,
                    createdAt: conversation?.createdAt,
                    lastMessageAt: null,
                    members: rpcMembers.users,
                    messages: conversation.messages.map((m: any) => {
                        return {
                            ...m,
                            fromUser: rpcMembers.users.find((rpcUser: any) => rpcUser.id === m.fromUserId),
                        }
                    }),
                });
            }

            return result;
        }),
        conversation: async (
            _: any,
            { id, messagePage = 1, messageLimit = 1 }: { id: string, messagePage: number, messageLimit: number },
            { currentUserId }: { currentUserId: string }
        ) => {
            try {
                let rpcConversation = await ChatService.findConversation({ conversationId: id });

                let responseConversation = {
                    ...rpcConversation,
                };
                return responseConversation;
            } catch (error: any) {
                switch (error.code) {
                    case grpc.status.NOT_FOUND:
                        throw new GraphQLError("Conversation not found", {
                            extensions: {
                                code: StatusCode.BAD_REQUEST,
                            }
                        });
                    default:
                        logger.error(error.message);
                        throw new GraphQLError("Something went wrong", {
                            extensions: {
                                code: StatusCode.INTERNAL_SERVER_ERROR,
                            }
                        });
                }
            }
        }
    },
    Conversation: {
        members: async (
            conversation: any,
        ) => {
            if (conversation.members) return conversation.members;
            let rpcMembers = await UserService.getUsers({ userIds: conversation.memberIds });
            return rpcMembers.users;
        },
        messages: async (
            conversation: any,
            { messagePage, messageLimit }: { messagePage: number, messageLimit: number },
        ) => {
            let rpcConversation = await ChatService.findConversation({
                conversationId: conversation.id,
                messagePage: messagePage,
                messageLimit: messageLimit
            });

            let senderIds: string[] = Array.from(new Set(rpcConversation.messages.map((m: any) => m.fromUserId)));
            let rpcSenders = await UserService.getUsers({ userIds: senderIds });

            let messages = rpcConversation.messages.map((message: any) => {
                return {
                    ...message,
                    fromUser: rpcSenders.users.find((user: any) => user.id === message.fromUserId)
                }
            });
            return messages;
        }
    },
    Mutation: {
        signin: async (
            _: any,
            { username, password }: { username: string, password: string },
        ) => {
            try {
                let response = await UserService.signin({ username, password });
                return response;
            } catch (err: any) {
                switch (err.code) {
                    case grpc.status.INVALID_ARGUMENT:
                        throw new GraphQLError("Authorization failed", {
                            extensions: {
                                code: StatusCode.BAD_REQUEST,
                            }
                        });
                    default:
                        throw new GraphQLError("Something went wrong", {
                            extensions: {
                                code: StatusCode.INTERNAL_SERVER_ERROR,
                            }
                        });
                }
            }
        },

        signup: async (
            _: any,
            { username, password, displayName, avatar }: { username: string, password: string, displayName: string, avatar: Promise<any> },
        ) => {
            let avatarURL = null;
            if (avatar !== undefined) {
                const { createReadStream, filename, mimetype, encoding } = await avatar;
                const stream = createReadStream();
                avatarURL = `/upload/${uuidv4()}.${filename.split('.').at(-1)}`;
                const out = require('fs').createWriteStream(process.env.STATIC_DIRECTORY + avatarURL);
                stream.pipe(out);
                await finished(out);
            }
            try {
                let response = await UserService.signup({ username, password, displayName, avatarURL });
                return response;
            } catch (err: any) {
                switch (err.code) {
                    case grpc.status.INVALID_ARGUMENT:
                        throw new GraphQLError("Username is already exist", {
                            extensions: {
                                code: StatusCode.CONFLICT,
                            }
                        });
                    default:
                        throw new GraphQLError("Something went wrong", {
                            extensions: {
                                code: StatusCode.INTERNAL_SERVER_ERROR,
                            }
                        });
                }
            }
        },

        createTrip: async (
            _: any,
            { name, description }: { name: string, description: string },
            { currentUserId }: { currentUserId: string }
        ) => {
            let trip = await Trip.create({
                id: uuidv4(),
                name,
                description,
                created_at: new Date(),
                created_by: currentUserId,
            });
            return {
                id: trip.id,
                name: trip.name,
                description: trip.description,
                createdBy: {
                    id: currentUserId,
                },
                members: [],
                points: [],
                createdAt: trip.createdAt,
            };
        },

        createConversation: async (
            _: any,
            { type, name, members }: { type: string, name: string, members: string },
            { currentUserId }: { currentUserId: string }
        ) => {
            // Note: The new private conversation will not created if that is exist already
            try {
                let memberIds = members.split(",");
                let membersInfo = await UserService.getUsers({ userIds: memberIds });

                if (membersInfo.users.length !== memberIds.length) {
                    throw new GraphQLError("Member not found", {
                        extensions: {
                            code: StatusCode.NOT_FOUND,
                        }
                    });
                }

                let data = await ChatService.createConversation({
                    ownerId: currentUserId,
                    name,
                    memberIds: memberIds,
                    type,
                });

                return {
                    ...data,
                    members: membersInfo.users,
                };
            } catch (error: any) {
                if (error instanceof GraphQLError) throw error;
                switch (error.code) {
                    case grpc.status.NOT_FOUND:
                        throw new GraphQLError("Member not found", {
                            extensions: {
                                code: StatusCode.NOT_FOUND,
                            }
                        });
                    default:
                        logger.error(error.message);
                        throw new GraphQLError("Something went wrong", {
                            extensions: {
                                code: StatusCode.INTERNAL_SERVER_ERROR,
                            }
                        });
                }
            }
        },
    },
};

export default resolvers;
