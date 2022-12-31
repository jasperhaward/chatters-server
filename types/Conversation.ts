import { User, Message } from ".";

export interface Conversation {
    id: string;
    recipients: User[];
    messages: Message[];
}
