import { FastifySchema } from "fastify";
import { Type } from "@sinclair/typebox";

import { User, Session } from "../schema";

// Register Schema

export const RegisterParameters = Type.Object({
    username: Type.String(),
    password: Type.String(),
    confirmPassword: Type.String(),
});

export const RegisterSchema = {
    body: RegisterParameters,
    response: {
        "2xx": User,
    },
} satisfies FastifySchema;

// Login Schema

export const LoginParameters = Type.Object({
    username: Type.String(),
    password: Type.String(),
});

export const LoginSchema = {
    body: LoginParameters,
    response: {
        "2xx": Session,
    },
} satisfies FastifySchema;
