export type SocketChatMessageRequest = {
  conversationId: string;
  content: string;
};

export type SocketChatMessageResponse = {
  status: 'SUCCESS' | 'FAILED';
};

export type SocketChatMessageEvent = {
  fromUserId: string;
  content: string;
  createdAt: string;
};

export type SocketListenConversationRequest = {
  conversationId: string;
};
