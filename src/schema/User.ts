import { Type } from "@sinclair/typebox";
import { User } from ".";

export const Session = Type.Object({
    user: User,
    token: Type.String(),
});
