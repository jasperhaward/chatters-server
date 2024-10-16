import { Type, Static } from "@sinclair/typebox";
import { UserWithCreatedAt } from "./User";

export const Recipient = Type.Intersect([
  UserWithCreatedAt,
  Type.Object({ conversationId: Type.String({ format: "uuid" }) }),
]);

export type TRecipient = Static<typeof Recipient>;
