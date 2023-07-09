import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";

import { Config } from "./config";
import { Database } from "./database";
import { FastifyTypebox, ClientConnection, ClientEvent } from "./types";

import authController from "./controllers/authController";
import contactsController from "./controllers/contactsController";
import conversationsController from "./controllers/conversationsController";
import indexController from "./controllers/indexController";
import socketController from "./controllers/socketController";

export default class App {
  config: Config;
  fastify: FastifyTypebox;
  db: Kysely<Database>;
  clientConnections: ClientConnection[];

  constructor(config: Config) {
    this.config = config;
    this.clientConnections = [];

    this.db = new Kysely<Database>({
      dialect: new PostgresDialect({
        pool: new Pool(this.config.database),
      }),
    });

    this.fastify = Fastify({ logger: true });

    this.fastify.decorateRequest("token", null);
    this.fastify.register(cors);
    this.fastify.register(websocket);

    this.fastify.register(indexController, { prefix: "/" });
    this.fastify.register(authController, {
      prefix: "/api/v1/auth",
      db: this.db,
      sendEvent: this.sendEvent,
    });
    this.fastify.register(contactsController, {
      prefix: "/api/v1/contacts",
      db: this.db,
      sendEvent: this.sendEvent,
    });
    this.fastify.register(conversationsController, {
      prefix: "/api/v1/conversations",
      db: this.db,
      sendEvent: this.sendEvent,
    });
    this.fastify.register(socketController, {
      prefix: "/api/v1/socket",
      db: this.db,
      clientConnections: this.clientConnections,
    });
  }

  async start() {
    await this.fastify.listen({
      port: this.config.port,
      host: this.config.host,
    });
    // verify DB connection & DB user permissions
    await this.db.selectFrom("user_account").execute();
  }

  async stop() {
    await this.fastify.close();
    await this.db?.destroy();
  }

  sendEvent = (recipientIds: string[], event: ClientEvent) => {
    for (const connection of this.clientConnections) {
      if (recipientIds.includes(connection.userId)) {
        connection.socket.send(JSON.stringify(event));
      }
    }
  };
}
