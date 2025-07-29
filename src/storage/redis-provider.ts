import { createClient, RedisClientType } from 'redis';
import { type Message, type Chat } from '../core/chat';
import { StorageProvider } from './types';

export class RedisStorageProvider implements StorageProvider {
    private readonly client: RedisClientType;
    private readonly messageKeyPrefix = 'message:';
    private readonly chatKeyPrefix = 'chat:';
    private readonly chatMetaKeyPrefix = 'chat_meta:';
    private readonly chatsKey = 'chats'; // A set of all chat correlation IDs

    constructor(redisUrl?: string) {
        this.client = createClient({ url: redisUrl });
    }

    async connect(): Promise<void> {
        if (!this.client.isOpen) {
            await this.client.connect();
        }
    }

    async disconnect(): Promise<void> {
        if (this.client.isOpen) {
            await this.client.quit();
        }
    }

    private getMessageKey(correlationId: string): string {
        return `${this.messageKeyPrefix}${correlationId}`;
    }

    private getChatKey(chatCorrelationId: string): string {
        return `${this.chatKeyPrefix}${chatCorrelationId}`;
    }

    private getChatMetaKey(chatCorrelationId: string): string {
        return `${this.chatMetaKeyPrefix}${chatCorrelationId}`;
    }

    async saveChat(chat: Chat): Promise<void> {
        const chatMetaKey = this.getChatMetaKey(chat.correlationId);
        await this.client.multi()
            .set(chatMetaKey, JSON.stringify(chat))
            .sAdd(this.chatsKey, chat.correlationId)
            .exec();
    }

    async getChat(chatCorrelationId: string): Promise<Chat | null> {
        const chatMetaKey = this.getChatMetaKey(chatCorrelationId);
        const data = await this.client.get(chatMetaKey);
        return data ? JSON.parse(data) as Chat : null;
    }

    async deleteChat(chatCorrelationId: string): Promise<void> {
        const chatKey = this.getChatKey(chatCorrelationId);
        const chatMetaKey = this.getChatMetaKey(chatCorrelationId);
        const messageIds = await this.client.sMembers(chatKey);
        const messageKeys = messageIds.map(id => this.getMessageKey(id));

        const multi = this.client.multi()
            .del(chatKey)
            .del(chatMetaKey)
            .sRem(this.chatsKey, chatCorrelationId);

        if (messageKeys.length > 0) {
            multi.del(messageKeys);
        }

        await multi.exec();
    }

    async listChats(): Promise<Chat[]> {
        const chatIds = await this.client.sMembers(this.chatsKey);
        if (chatIds.length === 0) {
            return [];
        }

        const chatMetaKeys = chatIds.map(id => this.getChatMetaKey(id));
        const results = await this.client.mGet(chatMetaKeys);

        return results
            .filter((data): data is string => data !== null)
            .map(data => JSON.parse(data) as Chat);
    }

    async saveMessage(message: Message): Promise<void> {
        const messageKey = this.getMessageKey(message.correlationId);
        const chatKey = this.getChatKey(message.chatCorrelationId);
        const chatMetaKey = this.getChatMetaKey(message.chatCorrelationId);
        const messageData = JSON.stringify(message);

        const existingChatData = await this.client.get(chatMetaKey);
        let chat = new Chat();

        if (existingChatData) {
            chat = JSON.parse(existingChatData) as Chat;
            chat.updatedAt = message.createdAt;
            if (!chat.participantIds.includes(message.senderCorrelationId)) {
                chat.participantIds.push(message.senderCorrelationId);
            }
        } else {
            chat.correlationId = message.chatCorrelationId;
            chat.participantIds = [message.senderCorrelationId];
            chat.createdAt = message.createdAt;
            chat.updatedAt = message.createdAt;
        }

        await this.client.multi()
            .set(messageKey, messageData)
            .sAdd(chatKey, message.correlationId)
            .set(chatMetaKey, JSON.stringify(chat))
            .sAdd(this.chatsKey, chat.correlationId)
            .exec();
    }

    async getMessage(correlationId: string): Promise<Message | null> {
        const messageKey = this.getMessageKey(correlationId);
        const data = await this.client.get(messageKey);
        return data ? JSON.parse(data) as Message : null;
    }

    async deleteMessage(correlationId: string): Promise<void> {
        const message = await this.getMessage(correlationId);
        if (message) {
            const messageKey = this.getMessageKey(correlationId);
            const chatKey = this.getChatKey(message.chatCorrelationId);
            await this.client.multi()
                .del(messageKey)
                .sRem(chatKey, correlationId)
                .exec();
        }
    }

    async listMessages(chatCorrelationId: string): Promise<Message[]> {
        const chatKey = this.getChatKey(chatCorrelationId);
        const correlationIds = await this.client.sMembers(chatKey);

        if (correlationIds.length === 0) {
            return [];
        }

        const messageKeys = correlationIds.map(id => this.getMessageKey(id));
        const results = await this.client.mGet(messageKeys);

        return results
            .filter((data): data is string => data !== null)
            .map(data => JSON.parse(data) as Message);
    }
}

export { StorageProvider };