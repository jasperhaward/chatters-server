import { WebSocket } from "ws";
import { Kysely } from "kysely";
import {
  FastifyInstance,
  FastifyBaseLogger,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault,
} from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";

import { Database } from "./database";
import { TConversation, TMessage, TUser } from "./schema";

export type FastifyTypebox = FastifyInstance<
  RawServerDefault,
  RawRequestDefaultExpression<RawServerDefault>,
  RawReplyDefaultExpression<RawServerDefault>,
  FastifyBaseLogger,
  TypeBoxTypeProvider
>;

export interface ConversationCreatedEvent {
  type: "conversation/created";
  payload: TConversation;
}

export interface MessageCreatedEvent {
  type: "message/created";
  payload: TMessage;
}

export interface RecipientAddedEvent {
  type: "recipient/added";
  payload: TUser;
}

export interface RecipientRemovedEvent {
  type: "recipient/removed";
  payload: TUser;
}

export interface ErrorEvent {
  type: "error";
  payload: {
    code: string;
    message: string;
  };
}

export type ServerEvent =
  | ConversationCreatedEvent
  | MessageCreatedEvent
  | RecipientAddedEvent
  | RecipientRemovedEvent
  | ErrorEvent;

export interface ClientConnection {
  userId: string;
  socket: WebSocket;
}

export interface ControllerOptions {
  db: Kysely<Database>;
}
