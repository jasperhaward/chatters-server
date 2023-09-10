import { Kysely } from "kysely";

import { Database } from "../database";
import { FastifyTypebox, ClientConnection, ErrorEvent } from "../types";
import {
  ExpiredAuthTokenError,
  InvalidAuthTokenError,
  validateToken,
  parseTokenScheme,
} from "../services";
import {
  ControllerError,
  InternalServerError,
  UnauthorisedError,
} from "../errors";

export interface SocketControllerOptions {
  db: Kysely<Database>;
  clientConnections: ClientConnection[];
}

export default async function socketController(
  fastify: FastifyTypebox,
  options: SocketControllerOptions
) {
  const { db, clientConnections } = options;

  fastify.get("/", { websocket: true }, (connection, request) => {
    const { socket } = connection;

    socket.on("message", async (data) => {
      try {
        const token = parseTokenScheme(`${data}`);

        const { userId } = await validateToken(db, token);

        const clientConnection: ClientConnection = {
          userId,
          socket,
        };

        clientConnections.push(clientConnection);
      } catch (error) {
        let transformedError: Error;

        if (
          error instanceof InvalidAuthTokenError ||
          error instanceof ExpiredAuthTokenError
        ) {
          transformedError = new UnauthorisedError();
        } else if (error instanceof Error) {
          transformedError = error;
        } else {
          transformedError = new InternalServerError();
        }

        const event: ErrorEvent = {
          type: "error",
          payload: {
            code:
              transformedError instanceof ControllerError
                ? transformedError.code
                : transformedError.name,
            message: transformedError.message,
          },
        };

        socket.send(JSON.stringify(event));
        connection.destroy();
        request.log.error(error);
      }
    });

    socket.on("close", () => {
      const connectionIndex = clientConnections.findIndex((connection) => {
        return connection.socket === socket;
      });

      // the current connection/socket may not be in the array of `clientConnections` if
      // the connection has yet to be authenticated or failed to authenticate
      const isExistingClientConnection = connectionIndex > -1;

      if (isExistingClientConnection) {
        clientConnections.splice(connectionIndex, 1);
      }
    });

    socket.on("error", request.log.error);
  });
}
