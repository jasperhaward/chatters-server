import { FastifySchema } from "fastify";
import { Type } from "@sinclair/typebox";

import { User, Session } from "../schema";

export const RegisterSchema = {
  body: Type.Object({
    username: Type.String(),
    password: Type.String(),
    confirmPassword: Type.String(),
  }),
  response: {
    "2xx": User,
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
