
export interface Message {
    attachment: Attachment | null;
    text: string;
    timestamp: number;
}

export interface Attachment {
    data: string;
    name: string;
    type: string;
}
