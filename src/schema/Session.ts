import { Type, Static } from "@sinclair/typebox";
import { User } from "./User";

export const Session = Type.Object({
  user: User,
  token: Type.String(),
});

export type TSession = Static<typeof Session>;
