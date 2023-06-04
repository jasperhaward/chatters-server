import { FastifySchema } from "fastify";
import { Type } from "@sinclair/typebox";

import { User } from "../schema";

export const GetContactsSchema = {
  response: {
    "2xx": Type.Array(User),
  },
} satisfies FastifySchema;
