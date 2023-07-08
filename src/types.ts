import { ParsedUrlQuery } from "querystring";
import { WebSocket } from "ws";
import { Kysely } from "kysely";
import {
  FastifyInstance,
  FastifyBaseLogger,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault,
  FastifyRequest,
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

/**
 * Types a request's raw properties. Useful in cases where we can't use a schema and type
 * provider to type the request, such as in a hook.
 *
 * For example, when not using a schema and type provider the default type for `request.query`
 * is `unknown` despite it being parsed and provided as an object to certain hooks and
 * request handlers. As such `RawFastifyRequest` types `request.query` as `ParsedUrlQuery`,
 * the type of the result from parsing the query parameters using `querystring`.
 */
export type RawFastifyRequest = FastifyRequest<{
  Querystring: ParsedUrlQuery;
}>;

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
