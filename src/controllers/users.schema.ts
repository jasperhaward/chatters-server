import { FastifySchema } from "fastify";
import { Type } from "@sinclair/typebox";

import { User } from "../schema";

// Get user schema

export const GetUserParameters = Type.Object({
    userId: Type.String(),
});

export const GetUserSchema = {
    params: GetUserParameters,
    response: {
        "2xx": User,
    },
} satisfies FastifySchema;
