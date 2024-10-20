import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

import { Config } from "./config";
import { Database } from "./database";
import { TUiConversationEvent } from "./schema";
import { FastifyTypebox, ClientConnection } from "./types";

import authController from "./controllers/authController";
import contactsController from "./controllers/contactsController";
import conversationsController from "./controllers/conversationsController";
import versionController from "./controllers/versionController";
import eventsController from "./controllers/eventsController";

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

    this.fastify.register(cors, {
      origin: this.config.origins,
    });
    this.fastify.register(websocket);
    this.fastify.register(swagger, this.config.swagger);
    this.fastify.register(swaggerUi, { prefix: "/" });

    this.fastify.register(versionController, { prefix: "/version" });
    this.fastify.register(authController, {
      prefix: "/api/v1/auth",
      db: this.db,
    });
    this.fastify.register(contactsController, {
      prefix: "/api/v1/contacts",
      db: this.db,
    });
    this.fastify.register(conversationsController, {
      prefix: "/api/v1/conversations",
      db: this.db,
      dispatchEvent: this.dispatchEvent,
    });
    this.fastify.register(eventsController, {
      prefix: "/api/v1/events",
      db: this.db,
      clientConnections: this.clientConnections,
    });
  }

  async start() {
    // verify DB connection & DB user permissions
    await this.db.selectFrom("user_account").execute();
    await this.fastify.listen({
      port: this.config.port,
      host: this.config.host,
    });

    // dispatch ping event for all active WS connections every 30 seconds, stopping
    // nginx closing the connection - https://nginx.org/en/docs/http/websocket.html
    setInterval(this.dispatchSocketPings, 30 * 1000);
  }

  async stop() {
    for (const connection of this.clientConnections) {
      connection.socket.close();
    }

    await this.fastify.close();
    await this.db?.destroy();
  }

  dispatchSocketPings = () => {
    for (const connection of this.clientConnections) {
      connection.socket.ping();
    }
  };

  dispatchEvent = (
    recipientIds: string[],
    events: TUiConversationEvent | TUiConversationEvent[]
  ) => {
    for (const connection of this.clientConnections) {
      if (recipientIds.includes(connection.userId)) {
        if (Array.isArray(events)) {
          for (const event of events) {
            connection.socket.send(JSON.stringify(event));
          }
        } else {
          connection.socket.send(JSON.stringify(events));
        }
      }
    }
  };
}
