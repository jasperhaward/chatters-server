import { FastifySchema } from "fastify";
import { Type } from "@sinclair/typebox";

import { Conversation, Message, User } from "../schema";

export const GetConversationsSchema = {
  response: {
    "2xx": Type.Array(Conversation),
  },
} satisfies FastifySchema;

export const CreateConversationsSchema = {
  body: Type.Object({
    recipientIds: Type.Array(Type.String({ format: "uuid" })),
    title: Type.Optional(Type.String()),
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
    createdBy: Type.String({ format: "uuid" }),
    content: Type.String(),
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
