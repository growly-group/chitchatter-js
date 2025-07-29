import { Pool } from 'pg';
import { type Message } from '../core/chat';
import { StorageProvider } from './types';

export class PgStorageProvider implements StorageProvider {
    private readonly pool: Pool;
    private readonly tableName = 'messages';

    constructor(connectionString?: string, chatTableName: string = 'chats') {
        this.pool = new Pool({ connectionString });
    }

    private async createTableIfNotExists(): Promise<void> {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS %I (
            correlation_id TEXT PRIMARY KEY,
            chat_correlation_id TEXT NOT NULL,
            data JSONB NOT NULL
            );
        `;
        const createIndexQuery = `
            CREATE INDEX IF NOT EXISTS idx_chat_correlation_id ON %I (chat_correlation_id);
        `;
        await this.pool.query(createTableQuery, [this.tableName]);
        await this.pool.query(createIndexQuery, [this.tableName]);
    }

    async connect(): Promise<void> {
        // The pool connects automatically on first query.
        // We'll use this method to ensure the necessary table exists.
        await this.createTableIfNotExists();
    }

    async disconnect(): Promise<void> {
        await this.pool.end();
    }

    async saveMessage(message: Message): Promise<void> {
        const query = `
            INSERT INTO %I (correlation_id, chat_correlation_id, data)
            VALUES ($1, $2, $3)
            ON CONFLICT (correlation_id) DO UPDATE SET
                chat_correlation_id = EXCLUDED.chat_correlation_id,
                data = EXCLUDED.data;
        `;
        const values = [this.tableName, message.correlationId, message.chatCorrelationId, JSON.stringify(message)];
        await this.pool.query(query, values);
    }

    async getMessage(correlationId: string): Promise<Message | null> {
        const query = `SELECT data FROM %I WHERE correlation_id = $1;`;
        const result = await this.pool.query(query, [this.tableName, correlationId]);

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0].data as Message;
    }

    async deleteMessage(correlationId: string): Promise<void> {
        const query = `DELETE FROM %I WHERE correlation_id = $1;`;
        await this.pool.query(query, [this.tableName, correlationId]);
    }

    async listMessages(chatCorrelationId: string): Promise<Message[]> {
        const query = `SELECT data FROM %I WHERE chat_correlation_id = $1;`;
        const result = await this.pool.query(query, [this.tableName, chatCorrelationId]);

        return result.rows.map(row => row.data as Message);
    }
}

export { StorageProvider };