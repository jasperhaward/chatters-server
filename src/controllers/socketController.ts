import { Kysely } from "kysely";

import authentication from "../hooks/authenticationHook";
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
      websocket: true,
      onRequest: authentication(db),
    },
    (connection, request) => {
      const { userId } = request.token;
      const { socket } = connection;

      const clientConnection: ClientConnection = {
        userId,
        socket,
      };

      connections.push(clientConnection);

      socket.on("close", () => {
        connections.splice(connections.indexOf(clientConnection), 1);
      });
    }
  );
}
