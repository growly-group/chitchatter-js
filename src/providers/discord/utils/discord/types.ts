export interface EmbedField {
    name: string;
    value: string;
    inline?: boolean;
}

export interface EmbedFooter {
    text: string;
    icon_url?: string;
}

export interface EmbedThumbnail {
    url: string;
}

export interface EmbedAuthor {
    name: string;
    url?: string;
    icon_url?: string;
}

export interface EmbedImage {
    url: string;
}

export interface EmbedData {
    title?: string;
    description?: string;
    url?: string;
    timestamp?: string;
    color?: number;
    fields?: EmbedField[];
    footer?: EmbedFooter;
    thumbnail?: EmbedThumbnail;
    image?: EmbedImage;
    author?: EmbedAuthor;
}