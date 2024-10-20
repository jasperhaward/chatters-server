import { Type, Static } from "@sinclair/typebox";
import { User, UserWithCreatedAt } from "./User";

export const Recipient = Type.Intersect([
  UserWithCreatedAt,
  Type.Object({
    createdBy: User,
  }),
]);

export type TRecipient = Static<typeof Recipient>;
