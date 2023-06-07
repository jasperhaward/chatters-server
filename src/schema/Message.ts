import { Type, Static } from "@sinclair/typebox";
import { User } from "./User";

export const Message = Type.Object({
  id: Type.String({ format: "uuid" }),
  conversationId: Type.String({ format: "uuid" }),
  content: Type.String(),
  createdAt: Type.String({ format: "date-time" }),
  createdBy: User,
});

export type TMessage = Static<typeof Message>;
