import { Kysely } from "kysely";

import authentication from "../hooks/authentication";
import { Database } from "../database";
import { FastifyTypebox, ClientConnection } from "../types";

export interface SocketControllerOptions {
  db: Kysely<Database>;
  connections: ClientConnection[];
}

export default async function socketController(
  fastify: FastifyTypebox,
  options: SocketControllerOptions
) {
  const { db, connections } = options;

  fastify.get(
    "/",
    {
      preHandler: authentication(db),
      websocket: true,
    },
    (connection, request) => {
      const { userId } = request.token;
      const { socket } = connection;

      const clientConnection: ClientConnection = {
        userId,
        socket,
      };

      connections.push(clientConnection);

      connection.socket.on("close", () => {
        connections.splice(connections.indexOf(clientConnection), 1);
      });
    }
  );
}
