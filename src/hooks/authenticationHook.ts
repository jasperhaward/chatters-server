import { Kysely } from "kysely";
import { onRequestHookHandler } from "fastify";

import { Database } from "../database";
import {
  ExpiredAuthTokenError,
  InvalidAuthTokenError,
  validateToken,
  removeTokenScheme,
} from "../services";
import { UnauthorisedError } from "../errors";
import "./authenticationTypes";

export default function authentication(
  db: Kysely<Database>
): onRequestHookHandler {
  return async (request) => {
    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorisedError();
    }

    const token = removeTokenScheme(authorization);

    try {
      request.token = await validateToken(db, token);
    } catch (error) {
      if (
        error instanceof InvalidAuthTokenError ||
        error instanceof ExpiredAuthTokenError
      ) {
        throw new UnauthorisedError();
      }

      throw error;
    }
  };
}
