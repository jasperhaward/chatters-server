import { FastifySchema } from "fastify";
import { Type } from "@sinclair/typebox";

import { UserWithCreatedAt, Session } from "../schema";
import config from "../config";

export const RegisterSchema = {
  body: Type.Object({
    username: Type.String({
      minLength: config.minUsernameLength,
      maxLength: config.maxUsernameLength,
    }),
    password: Type.String({
      minLength: config.minPasswordLength,
      maxLength: config.maxPasswordLength,
    }),
    confirmPassword: Type.String({
      minLength: config.minPasswordLength,
      maxLength: config.maxPasswordLength,
    }),
  }),
  response: {
    "2xx": UserWithCreatedAt,
  },
} satisfies FastifySchema;

export const LoginSchema = {
  body: Type.Object({
    username: Type.String(),
    password: Type.String(),
  }),
  response: {
    "2xx": Session,
  },
} satisfies FastifySchema;
