import Fastify from "fastify";
import cors from "@fastify/cors";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";

import { Config } from "./config";
import { Database } from "./database";
import { FastifyTypebox } from "./types";

import authController from "./controllers/authController";
import conversationsController from "./controllers/conversationsController";
import contactsController from "./controllers/contactsController";

export default class App {
  config: Config;
  fastify: FastifyTypebox;
  db: Kysely<Database>;

  constructor(config: Config) {
    this.config = config;

    this.db = new Kysely<Database>({
      dialect: new PostgresDialect({
        pool: new Pool(this.config.database),
      }),
    });

    this.fastify = Fastify({ logger: true });

    this.fastify.decorateRequest("token", null);
    this.fastify.register(cors);

    this.fastify.register(authController, {
      prefix: "/api/v1/auth",
      db: this.db,
    });
    this.fastify.register(conversationsController, {
      prefix: "/api/v1/conversations",
      db: this.db,
    });
    this.fastify.register(contactsController, {
      prefix: "/api/v1/contacts",
      db: this.db,
    });
  }

  async start() {
    await this.fastify.listen({ port: this.config.port });
  }

  async stop() {
    await this.fastify.close();
    await this.db?.destroy();
  }
}
