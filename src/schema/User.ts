import { Type, Static } from "@sinclair/typebox";

export const User = Type.Object({
  id: Type.String(),
  username: Type.String(),
});

export type TUser = Static<typeof User>;

export const UserWithPassword = Type.Intersect([
  User,
  Type.Object({
    password: Type.String(),
  }),
]);

export type TUserWithPassword = Static<typeof UserWithPassword>;
