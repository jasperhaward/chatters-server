import { FastifySchema } from "fastify";
import { Type } from "@sinclair/typebox";

import config from "../config";
import {
  Conversation,
  ConversationWithRecipientsAndLatestMessage,
  Message,
  UserWithCreatedAt,
} from "../schema";

export const GetConversationsSchema = {
  response: {
    "2xx": Type.Array(ConversationWithRecipientsAndLatestMessage),
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
    "2xx": ConversationWithRecipientsAndLatestMessage,
  },
} satisfies FastifySchema;

export const UpdateConversationSchema = {
  params: Type.Object({
    conversationId: Type.String({ format: "uuid" }),
  }),
  body: Type.Object({
    // for now the only updateable property is the title so we can mark it as required
    title: Type.Union([
      Type.String({
        minLength: 1,
        maxLength: config.maxConversationTitleLength,
      }),
      Type.Null(),
    ]),
  }),
  response: {
    "2xx": Conversation,
  },
} satisfies FastifySchema;

export const GetConversationMessagesSchema = {
  params: Type.Object({
    conversationId: Type.String({ format: "uuid" }),
  }),
  response: {
    "2xx": Type.Array(Message),
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
    "2xx": UserWithCreatedAt,
  },
} satisfies FastifySchema;

export const DeleteConversationRecipientSchema = {
  params: Type.Object({
    conversationId: Type.String({ format: "uuid" }),
    recipientId: Type.String({ format: "uuid" }),
  }),
} satisfies FastifySchema;
