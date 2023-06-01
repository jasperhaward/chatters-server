import { FastifySchema } from "fastify";
import { Type } from "@sinclair/typebox";

import { Conversation } from "../schema";

export const GetConversationsSchema = {
  response: {
    "2xx": Type.Array(Conversation),
  },
} satisfies FastifySchema;
