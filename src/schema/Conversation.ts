import { Type, Static } from "@sinclair/typebox";
import { User } from "./User";
import { Recipient } from "./Recipient";
import { ConversationEvent } from "./ConversationEvent";

export const Conversation = Type.Object({
  conversationId: Type.String({ format: "uuid" }),
  createdAt: Type.String({ format: "date-time" }),
  createdBy: User,
  title: Type.Union([Type.String(), Type.Null()]),
  recipients: Type.Array(Recipient),
  latestEvent: ConversationEvent,
});

export type TConversation = Static<typeof Conversation>;
export type TConversationWithoutRecipients = Omit<TConversation, "recipients">;
