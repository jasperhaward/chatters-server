import { Type, Static } from "@sinclair/typebox";
import { User } from "./User";

export const Message = Type.Object({
  id: Type.String(),
  conversationId: Type.String(),
  content: Type.String(),
  createdAt: Type.String(),
  createdBy: User,
});

export type TMessage = Static<typeof Message>;
