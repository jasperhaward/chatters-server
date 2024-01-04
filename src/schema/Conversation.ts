import { Type, Static } from "@sinclair/typebox";
import { User } from "./User";
import { Recipient } from "./Recipient";
import { Message } from "./Message";

export const Conversation = Type.Object({
  id: Type.String({ format: "uuid" }),
  createdAt: Type.String({ format: "date-time" }),
  createdBy: User,
  title: Type.Union([Type.String(), Type.Null()]),
});

export type TConversation = Static<typeof Conversation>;

export const ConversationWithRecipientsAndLatestMessage = Type.Intersect([
  Conversation,
  Type.Object({
    recipients: Type.Array(Recipient),
    latestMessage: Type.Union([Message, Type.Null()]),
  }),
]);

export type TConversationWithRecipientsAndLatestMessage = Static<
  typeof ConversationWithRecipientsAndLatestMessage
>;
