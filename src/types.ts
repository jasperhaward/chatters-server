import {
  FastifyInstance,
  FastifyBaseLogger,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault,
} from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { Kysely } from "kysely";

import { Database } from "./database";
import { TokenPayload } from "./services";

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
}

export type WithCreatedByUsername<T> = T & {
  created_by_username: string;
};

export type WithUsername<T> = T & {
  username: string;
};
