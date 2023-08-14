import { Type, Static } from "@sinclair/typebox";

export const User = Type.Object({
  id: Type.String({ format: "uuid" }),
  username: Type.String(),
});

export type TUser = Static<typeof User>;

export const UserWithCreatedAt = Type.Intersect([
  User,
  Type.Object({
    createdAt: Type.String(),
  }),
]);

export type TUserWithCreatedAt = Static<typeof UserWithCreatedAt>;

export interface TUserWithPassword extends TUserWithCreatedAt {
  password: string;
}
