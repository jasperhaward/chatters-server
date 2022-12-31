import { User, Conversation } from "../types";

export const recipient1: User = {
    id: "R-2",
    username: "Monika Rahne",
};

export const recipient2: User = {
    id: "R-3",
    username: "Benedict Ng",
};

export const recipients = [recipient1, recipient2];

export const conversations: Conversation[] = [
    {
        id: "C-1",
        recipients: [recipient1, recipient2],
        messages: [],
    },
    {
        id: "C1",
        recipients: [recipient1, recipient2],
        messages: [],
    },
];
