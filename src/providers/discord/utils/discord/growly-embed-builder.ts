import type { EmbedData, EmbedField } from './types';

const EMBED_LIMITS = {
    title: 256,
    description: 4096,
    fields: 25,
    fieldName: 256,
    fieldValue: 1024,
    footerText: 2048,
    authorName: 256,
    total: 6000,
};

class EmbedBuilder {
    private data: EmbedData;

    constructor() {
        this.data = {};
    }

    setTitle(title: string): this {
        if (title.length > EMBED_LIMITS.title) {
            throw new Error(`You excepted the limit for titles: ${EMBED_LIMITS.title}`)
        }
        this.data.title = title;
        return this;
    }

    setDescription(description: string): this {
        if (description.length > EMBED_LIMITS.description) {
            throw new Error(`You excepted the limit for description: ${EMBED_LIMITS.description}`);
        }
        this.data.description = description;
        return this;
    }

    setURL(url: string): this {
        this.data.url = url;
        return this;
    }


    setTimestamp(timestamp: Date | string = new Date()): this {
        this.data.timestamp = new Date(timestamp).toISOString();
        return this;
    }

    setColor(color: number | string): this {
        this.data.color = typeof color === 'string' ? parseInt(color.replace('#', ''), 16) : color;
        return this;
    }

    setFooter(text: string, iconURL?: string): this {
        if (text.length > EMBED_LIMITS.footerText) {
            throw new Error(`You excepted the limit for footerText: ${EMBED_LIMITS.footerText}`)
        }
        this.data.footer = { text, icon_url: iconURL };
        return this;
    }

    setImage(url: string): this {
        this.data.image = { url };
        return this
    }

    setThumbnail(url: string): this {
        this.data.thumbnail = { url }
        return this;
    }

    setAuthor(name: string, iconURL?: string, url?: string): this {
        if (name.length > EMBED_LIMITS.authorName) {
            throw new Error(`You excepted the limit for authorName: ${EMBED_LIMITS.authorName}`)
        }
        this.data.author = { name, icon_url: iconURL, url };
        return this;

    }

    addField(name: string, value: string, inline: boolean = false): this {
        if (!this.data.fields) {
            this.data.fields = [];
        }

        if (this.data.fields.length >= EMBED_LIMITS.fields) {
            throw new Error(`You excepted the limit for fields: ${EMBED_LIMITS.fields}`)
        }

        if (name.length > EMBED_LIMITS.fieldName) {
            throw new Error(`You excepted the limit for fieldName: ${EMBED_LIMITS.fieldName}`)
        }

        if (value.length > EMBED_LIMITS.fieldValue) {
            throw new Error(`You excepted the limit for fieldValue: ${EMBED_LIMITS.fieldValue}`)
        }

        this.data.fields.push({ name, value, inline });
        return this;
    }

    build(): EmbedData {
        let totalLength = 0;
        totalLength += this.data.title?.length ?? 0;
        totalLength += this.data.description?.length ?? 0;
        totalLength += this.data.footer?.text.length ?? 0;
        totalLength += this.data.author?.name.length ?? 0;

        this.data.fields?.forEach(field => {
            totalLength += field.name.length;
            totalLength += field.value.length;
        });

        if (totalLength > EMBED_LIMITS.total) {
            throw new Error(`You have excepted the maximum limit for the embed: ${EMBED_LIMITS.total}`);
        }

        return { ...this.data };
    }
}

export default EmbedBuilder;