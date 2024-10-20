import { Type, Static } from "@sinclair/typebox";
import { User } from "./User";
import { Recipient } from "./Recipient";

export const Conversation = Type.Object({
  conversationId: Type.String({ format: "uuid" }),
  createdAt: Type.String({ format: "date-time" }),
  createdBy: User,
  title: Type.Union([Type.String(), Type.Null()]),
  recipients: Type.Array(Recipient),
  latestMessage: Type.Union([
    Type.Object({
      id: Type.Number(),
      createdAt: Type.String({ format: "date-time" }),
      createdBy: User,
      content: Type.String(),
    }),
    Type.Null(),
  ]),
});

export type TConversation = Static<typeof Conversation>;
