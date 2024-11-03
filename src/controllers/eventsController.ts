import { FastifyTypebox, ClientConnection, ControllerOptions } from "../types";
import { InternalServerError, UnauthorisedError } from "../errors";
import {
  ExpiredAuthTokenError,
  InvalidAuthTokenError,
  validateToken,
  removeTokenScheme,
} from "../services";

export interface EventsControllerOptions extends ControllerOptions {
  clientConnections: ClientConnection[];
}

export default async function eventsController(
  fastify: FastifyTypebox,
  options: EventsControllerOptions
) {
  const { db, clientConnections } = options;

  fastify.get("/", { websocket: true }, (connection, request) => {
    const { socket } = connection;

    socket.on("message", async (data) => {
      try {
        const rawToken = removeTokenScheme(`${data}`);
        const token = await validateToken(db, rawToken);

        const clientConnection: ClientConnection = {
          userId: token.userId,
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

        const event = {
          type: "Error",
          code: transformedError.name,
          message: transformedError.message,
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
