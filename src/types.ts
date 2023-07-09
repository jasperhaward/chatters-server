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
  type: "conversation";
  payload: TConversation;
}

export interface MessageCreatedEvent {
  type: "message";
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

export type ClientEvent =
  | ConversationCreatedEvent
  | MessageCreatedEvent
  | RecipientAddedEvent
  | RecipientRemovedEvent;

export interface ClientConnection {
  userId: string;
  socket: WebSocket;
}

export interface ControllerOptions {
  db: Kysely<Database>;
  sendEvent: (recipientIds: string[], event: ClientEvent) => void;
}
