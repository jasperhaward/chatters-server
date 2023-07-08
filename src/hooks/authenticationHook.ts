import { Kysely } from "kysely";
import { onRequestHookHandler } from "fastify";

import { Database } from "../database";
import {
  ExpiredAuthTokenError,
  InvalidAuthTokenError,
  validateToken,
} from "../services";
import { UnauthorisedError } from "../errors";
import { RawFastifyRequest } from "../types";

export default function authentication(
  db: Kysely<Database>
): onRequestHookHandler {
  return async (request) => {
    const { headers, query } = request as RawFastifyRequest;

    const authorization = headers.authorization || query.authorization;

    if (!authorization || typeof authorization !== "string") {
      throw new UnauthorisedError();
    }

    const token = authorization.substring("Bearer ".length);

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
