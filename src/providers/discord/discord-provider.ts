import type { EmbedData } from './utils/discord/GrowlyEmbed';
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
        const webhookUrl = Bun.env.WEBHOOK_URL;
        if (!webhookUrl) {
            console.error("Verifique o arquivo .env na raiz do projeto e verifique se colocou o Webhook corretamente.");
            process.exit(1);
        }

        this.webhookUrl = webhookUrl;
        this.defaultUsername = Bun.env.BOT_USERNAME || "WebHook";
        this.defaultAvatarUrl = Bun.env.BOT_AVATAR_URL || "https://i.pinimg.com/1200x/c4/86/26/c486262e0309b85a93b4274d3a0a396f.jpg";
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