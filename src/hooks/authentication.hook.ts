import { preHandlerHookHandler } from "fastify";
import { Kysely } from "kysely";
import { Database } from "../database";
import {
    ExpiredAuthTokenError,
    InvalidAuthTokenError,
    validateToken,
} from "../services/token.service";
import { Unauthorised } from "../util/errors";

export default function authentication(
    db: Kysely<Database>
): preHandlerHookHandler {
    return async (request) => {
        const { authorization } = request.headers;

        if (!authorization) {
            throw new Unauthorised();
        }

        const token = authorization.substring("Bearer ".length);

        try {
            request.token = await validateToken(db, token);
        } catch (error) {
            if (
                error instanceof InvalidAuthTokenError ||
                error instanceof ExpiredAuthTokenError
            ) {
                throw new Unauthorised();
            }

            throw error;
        }
    };
}
