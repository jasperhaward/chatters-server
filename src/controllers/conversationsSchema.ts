import { FastifySchema } from "fastify";
import { Type } from "@sinclair/typebox";

import { Conversation, Message, User } from "../schema";
import config from "../config";

export const GetConversationsSchema = {
  response: {
    "2xx": Type.Array(Conversation),
  },
} satisfies FastifySchema;

export const CreateConversationSchema = {
  body: Type.Object({
    recipientIds: Type.Array(Type.String({ format: "uuid" })),
    title: Type.Optional(
      Type.String({
        minLength: 1,
        maxLength: config.maxConversationTitleLength,
      })
    ),
  }),
  response: {
    "2xx": Conversation,
  },
} satisfies FastifySchema;

export const CreateConversationMessageSchema = {
  params: Type.Object({
    conversationId: Type.String({ format: "uuid" }),
  }),
  body: Type.Object({
    content: Type.String({
      pattern: "\\S", // message cannot be only whitespace
      maxLength: config.maxMessageLength,
    }),
  }),
  response: {
    "2xx": Message,
  },
} satisfies FastifySchema;

export const CreateConversationRecipientSchema = {
  params: Type.Object({
    conversationId: Type.String({ format: "uuid" }),
  }),
  body: Type.Object({
    recipientId: Type.String({ format: "uuid" }),
  }),
  response: {
    "2xx": User,
  },
} satisfies FastifySchema;

export const DeleteConversationRecipientSchema = {
  params: Type.Object({
    conversationId: Type.String({ format: "uuid" }),
  }),
  body: Type.Object({
    recipientId: Type.String({ format: "uuid" }),
  }),
} satisfies FastifySchema;
