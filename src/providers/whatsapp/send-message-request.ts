interface WhatsappMessage {
    type: string;
    [key: string]: any;
}

interface WhatsappSendMessageResponse {
    messaging_product: "whatsapp";
    contacts: {
        input: string;
        wa_id: string;
    }[];
    messages: {
        id: string;
        message_status: string;
    }[];
}

interface SendMessageOptions {
    apiUrl: string;
    apiVersion: string;
    token: string;
    phoneNumberId: string;
    to: string;
    message: WhatsappMessage;
}

async function sendMessageRequest(options: SendMessageOptions): Promise<WhatsappSendMessageResponse> {
    const { apiUrl, apiVersion, token, phoneNumberId, to, message } = options;
    const url = `${apiUrl}/${apiVersion}/${phoneNumberId}/messages`;

    const body = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        ...message
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`WhatsApp API Error: ${error.error?.message || response.statusText}`);
    }

    return await response.json();
}

export { WhatsappMessage, WhatsappSendMessageResponse, sendMessageRequest };