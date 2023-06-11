import { Kysely } from "kysely";
import { WebSocket } from "ws";
import {
  FastifyInstance,
  FastifyBaseLogger,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault,
} from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";

import { Database } from "./database";
import { TokenPayload } from "./services";
import { TConversation, TMessage, TUser } from "./schema";

declare module "fastify" {
  export interface FastifyRequest {
    token: TokenPayload;
  }
}

export type FastifyTypebox = FastifyInstance<
  RawServerDefault,
  RawRequestDefaultExpression<RawServerDefault>,
  RawReplyDefaultExpression<RawServerDefault>,
  FastifyBaseLogger,
  TypeBoxTypeProvider
>;

export interface ControllerOptions {
  db: Kysely<Database>;
  sendEvent: (recipientIds: string[], event: ClientEvent) => void;
}

export type WithCreatedByUsername<T> = T & {
  created_by_username: string;
};

export type WithUsername<T> = T & {
  username: string;
};

export interface ClientConnection {
  userId: string;
  socket: WebSocket;
}

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
