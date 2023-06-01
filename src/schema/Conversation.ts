import { Type, Static } from "@sinclair/typebox";
import { User } from "./User";
import { Message } from "./Message";

export const Conversation = Type.Object({
  id: Type.String(),
  recipients: Type.Array(User),
  messages: Type.Array(Message),
});

export type TConversation = Static<typeof Conversation>;
