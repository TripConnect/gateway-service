export type SocketChatMessageRequest = {
    conversationId: string
    content: string
}

export type SocketChatMessageResponse = {
    conversationId: string
    fromUserId: string
    content: string,
    createdAt: string,
}
