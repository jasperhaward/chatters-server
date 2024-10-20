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

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type FastifyTypebox = FastifyInstance<
  RawServerDefault,
  RawRequestDefaultExpression<RawServerDefault>,
  RawReplyDefaultExpression<RawServerDefault>,
  FastifyBaseLogger,
  TypeBoxTypeProvider
>;

export interface ClientConnection {
  userId: string;
  socket: WebSocket;
}

export interface ControllerOptions {
  db: Kysely<Database>;
}
