import { Type, Static } from "@sinclair/typebox";
import { User } from "./User";
import { Message } from "./Message";

export const Conversation = Type.Object({
  id: Type.String({ format: "uuid" }),
  createdAt: Type.String({ format: "date-time" }),
  createdBy: User,
  title: Type.Union([Type.String(), Type.Null()]),
  recipients: Type.Array(User),
  latestMessage: Type.Union([Message, Type.Null()]),
});

export type TConversation = Static<typeof Conversation>;
export type TConversationOmitRecipients = Omit<TConversation, "recipients">;
