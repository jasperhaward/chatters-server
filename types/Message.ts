import { User } from ".";

export interface MessageParams {
    conversationId: string;
    content: string;
    createdById: string;
}

export interface Message extends Omit<MessageParams, "createdById"> {
    id: string;
    createdAt: string;
    createdBy: User;
}
