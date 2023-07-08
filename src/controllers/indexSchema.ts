import { FastifySchema } from "fastify";
import { Type } from "@sinclair/typebox";

export const IndexSchema = {
  response: {
    "2xx": Type.Object({
      name: Type.String(),
      version: Type.String(),
    }),
  },
} satisfies FastifySchema;
