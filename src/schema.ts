import { Type } from "@sinclair/typebox";

export const User = Type.Object({
    id: Type.String(),
    username: Type.String(),
});

export const Session = Type.Object({
    user: User,
    token: Type.String(),
});
