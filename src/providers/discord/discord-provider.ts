import type { EmbedData } from './utils/discord/growly-embed';
export type DiscordMessage = string | EmbedData;


interface WebhookMessageOptions {
    username?: string;
    avatarUrl?: string;
}

class DiscordWebhook {
    private webhookUrl: string;
    private defaultUsername: string;
    private defaultAvatarUrl: string;

    constructor() {
        const webhookUrl = process.env.WEBHOOK_URL;
        if (!webhookUrl) {
            console.error("WEBHOOK_URL can't be empty. Check .env");
            process.exit(1);
        }

        this.webhookUrl = webhookUrl;
        this.defaultUsername = process.env.BOT_USERNAME || "WebHook";
        this.defaultAvatarUrl = process.env.BOT_AVATAR_URL || "https://i.ibb.co/rR4bf5Jy/169310904-s-200-v-4.png";
    }


    async sendMessage(message: DiscordMessage, messageOptions?: WebhookMessageOptions): Promise<void> {
        let body: {
            content?: string;
            embeds?: EmbedData[];
            username?: string;
            avatar_url?: string;
        } = {}

        if (typeof message === 'string') {
            body.content = message;
        } else {
            body.embeds = [message];
        }

        body.username = messageOptions?.username || this.defaultUsername;
        body.avatar_url = messageOptions?.avatarUrl || this.defaultAvatarUrl;

        const resp = await fetch(this.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify(body),
        });
    }
}

export { DiscordWebhook };