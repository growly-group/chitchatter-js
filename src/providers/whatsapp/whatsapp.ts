import { sendMessageRequest, WhatsappMessage, WhatsappSendMessageResponse } from './send-message-request';

class Whatsapp {
    private token: string;
    private userId: string;
    private userName: string;

    static API_URL = 'https://api.whatsapp.com';
    static GRAPH_API_URL = 'https://graph.facebook.com';
    static GRAPH_API_VERSION = 'v23.0';

    async connect(token: string): Promise<void> {
        this.token = token;
        const response = await fetch(`${Whatsapp.GRAPH_API_URL}/${Whatsapp.GRAPH_API_VERSION}/me?access_token=${this.token}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`WhatsApp API Error: ${error.error?.message || response.statusText}`);
        }

        const userInfo = await response.json();
        this.userId = userInfo.id;
        this.userName = userInfo.name;
    }

    async sendMessage(to: string, message: WhatsappMessage): Promise<WhatsappSendMessageResponse> {
        if (!this.token) {
            throw new Error('WhatsApp API not connected');
        }

        return sendMessageRequest({
            apiUrl: Whatsapp.API_URL,
            apiVersion: Whatsapp.GRAPH_API_VERSION,
            token: this.token,
            phoneNumberId: this.userId,
            to,
            message
        });
    }
}




export { Whatsapp };