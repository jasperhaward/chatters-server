import { FastifySchema } from "fastify";
import { Type } from "@sinclair/typebox";

export const VersionSchema = {
  response: {
    "2xx": Type.Object({
      name: Type.String(),
      version: Type.String(),
      environment: Type.String(),
    }),
  },
} satisfies FastifySchema;
