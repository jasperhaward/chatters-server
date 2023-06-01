import {
  FastifyInstance,
  FastifyBaseLogger,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault,
} from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { Kysely } from "kysely";
import { Database } from "../src/database";
import { TokenPayload } from "../src/services/token.service";

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

export interface WithDb {
  db: Kysely<Database>;
}
