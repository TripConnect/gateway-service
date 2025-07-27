export type SocketChatMessageRequest = {
  conversationId: string;
  content: string;
};

export type SocketChatMessageResponse = {
  status: 'DONE' | 'FAILED';
};

export type SocketChatMessageEvent = {
  fromUserId: string;
  content: string;
  createdAt: string;
};

export type SocketListenConversationRequest = {
  conversationId: string;
};
