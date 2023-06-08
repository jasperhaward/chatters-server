import { Type, Static } from "@sinclair/typebox";
import { UserWithCreatedAt } from "./User";

export const Session = Type.Object({
  user: UserWithCreatedAt,
  token: Type.String(),
});

export type TSession = Static<typeof Session>;
