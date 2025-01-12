let grpc = require('@grpc/grpc-js');
const { GraphQLUpload } = require('graphql-upload-ts');
import { GraphQLError } from 'graphql';
import { v4 as uuidv4 } from 'uuid';
import { finished } from "stream/promises";

import UserService from "services/grpc/userService";
import ChatService from "services/grpc/chatService";
import TwofaService from 'services/grpc/twofaService';
import { AuthenticatedRequest } from 'services/graphql/middlewares';
import logger from "utils/logging";
import { StatusCode } from "utils/graphql";

const resolvers = {
    Upload: GraphQLUpload,
    Query: {
        status: async () => {
            return { status: true };
        },
        me: async (
            _: any,
            params: {},
            { currentUserId }: { currentUserId: string }
        ) => {
            let currentUser = await UserService.findUser({ userId: currentUserId });
            return currentUser;
        },
        user: async (
            _: any,
            { id }: { id: string }
        ) => {
            let user = await UserService.findUser({ userId: id });
            return user;
        },
        users: async (
            _: any,
            { searchTerm }: { searchTerm: string },
            { currentUserId }: { currentUserId: string }
        ) => {
            let users = await UserService.searchUser({ term: searchTerm });
            return users;
        },
        conversations: AuthenticatedRequest(async (
            _: any,
            { page = 1, limit = 100, messageLimit = 10 }: { page: number, limit: number, messageLimit: number },
            { currentUserId }: { currentUserId: string }
        ) => {
            let result = [];
            let conversations = await ChatService.searchConversations({ memberIds: [currentUserId], page, limit, messageLimit });
            for (let conversation of conversations) {
                let members = await UserService.getUsers({ userIds: conversation.memberIds });

                result.push({
                    id: conversation.id,
                    name: conversation.name,
                    type: conversation.type,
                    createdBy: null,
                    createdAt: conversation.createdAt,
                    lastMessageAt: null,
                    members: members,
                    messages: conversation.messages.map(message => {
                        return {
                            ...message,
                            fromUser: members.find(member => member.id === message.fromUserId),
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
            let users = await UserService.getUsers({ userIds: conversation.memberIds });
            return users;
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
            let senders = await UserService.getUsers({ userIds: senderIds });

            let messages = rpcConversation.messages.map((message: any) => {
                return {
                    ...message,
                    fromUser: senders.find((user) => user.id === message.fromUserId)
                }
            });
            return messages;
        }
    },
    Mutation: {
        signin: async (
            _: any,
            { username, password, otp = '' }: { username: string, password: string, otp?: string },
        ) => {
            try {
                let authPayload = await UserService.signin({ username, password });
                if (!authPayload.userInfo.enabledTwofa) return authPayload;

                let secondFactorResp = await TwofaService.validate2FA({ resourceId: authPayload.userInfo.id, otp });
                if (secondFactorResp.success) return authPayload;

                return new GraphQLError("Two-factor authentication required", {
                    extensions: {
                        code: StatusCode.MULTI_FACTOR_REQUIRED,
                    }
                });
            } catch (error: any) {
                switch (error.code) {
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

        createConversation: async (
            _: any,
            { type, name, members }: { type: string, name: string, members: string },
            { currentUserId }: { currentUserId: string }
        ) => {
            // Note: The new private conversation will not created if that is exist already
            try {
                let memberIds = members.split(",");
                let membersInfo = await UserService.getUsers({ userIds: memberIds });

                if (membersInfo.length !== memberIds.length) {
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
                    members: membersInfo,
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

        generate2FASecret: async (
            _: any,
            { secret, otp }: { secret: string, otp: string },
            { currentUserId }: { currentUserId: string }
        ) => {
            try {
                let user = await UserService.findUser({ userId: currentUserId });
                let setting = await TwofaService.generate2FASecret({ label: user.displayName });
                return setting;
            } catch (error: any) {
                logger.error(error.message);
                throw new GraphQLError("Something went wrong", {
                    extensions: {
                        code: StatusCode.INTERNAL_SERVER_ERROR,
                    }
                });
            }
        },

        enable2FA: async (
            _: any,
            { secret, otp }: { secret: string, otp: string },
            { currentUserId }: { currentUserId: string }
        ) => {
            try {
                if (!new RegExp("^[0-9]{6}$").test(otp)) {
                    return new GraphQLError("Invalid OTP", {
                        extensions: {
                            code: StatusCode.BAD_REQUEST,
                        }
                    });
                }
                let user = await UserService.findUser({ userId: currentUserId });
                await TwofaService.enable2FA({ resourceId: user.id, secret, otp, label: user.displayName });
                return {
                    success: true
                };
            } catch (error: any) {
                logger.error(error.message);
                switch (error.code) {
                    case grpc.status.INVALID_ARGUMENT:
                        throw new GraphQLError("Bad request", {
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
        }
    },
};

export default resolvers;
