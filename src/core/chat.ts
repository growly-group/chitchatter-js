interface Message {
    correlationId: string;
    senderCorrelationId: string;
    chatCorrelationId: string;
    providerId: string;
    createdAt: number;
    updatedAt: number;
    textContent?: string;
    mediaContent?: ArrayBuffer;
}

class Chat {
    private readonly messagesMemoryCache: Map<string, Message> = new Map();
    correlationId: string;
    createdAt: number;
    updatedAt: number;
    participantIds: string[];
}

export { Chat, Message };