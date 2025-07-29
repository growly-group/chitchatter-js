import { type Message } from "../core/chat";

interface StorageProvider {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    saveMessage(message: Message): Promise<void>;
    getMessage(correlationId: string): Promise<Message | null>;
    deleteMessage(correlationId: string): Promise<void>;
    listMessages(chatCorrelationId: string): Promise<Message[]>;
}

export { StorageProvider };