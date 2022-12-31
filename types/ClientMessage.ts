import { MessageParams } from ".";

export type ClientMessage = ClientHandshake | ClientConversationsMessagesSend;

export interface ClientHandshake {
    type: "handshake";
    payload: {
        userId: string;
    };
}

export interface ClientConversationsMessagesSend {
    type: "conversations/messages/send";
    payload: MessageParams;
}
