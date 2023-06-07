import { Type, Static } from "@sinclair/typebox";
import { User } from "./User";
import { Message } from "./Message";

export const Conversation = Type.Object({
  id: Type.String(),
  createdAt: Type.String(),
  createdBy: User,
  title: Type.Union([Type.String(), Type.Null()]),
  recipients: Type.Array(User),
  messages: Type.Array(Message),
});

export type TConversation = Static<typeof Conversation>;
