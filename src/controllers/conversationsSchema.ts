import { FastifySchema } from "fastify";
import { Type } from "@sinclair/typebox";

import { Conversation } from "../schema";

export const GetConversationsSchema = {
  response: {
    "2xx": Type.Array(Conversation),
  },
} satisfies FastifySchema;

export const CreateConversationParameters = Type.Object({
  recipientIds: Type.Array(Type.String()),
  title: Type.Optional(Type.String()),
});

export const CreateConversationsSchema = {
  body: CreateConversationParameters,
  response: {
    "2xx": Conversation,
  },
} satisfies FastifySchema;
