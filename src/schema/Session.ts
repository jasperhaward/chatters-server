import { Type } from "@sinclair/typebox";

export const User = Type.Object({
    id: Type.String(),
    username: Type.String(),
});
