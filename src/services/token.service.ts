import { Kysely } from "kysely";
import jwt, { JwtPayload, TokenExpiredError } from "jsonwebtoken";

import config from "../config";
import { Database } from "../database";
import { insertToken, findTokenById } from "../stores/token.store";

export class InvalidAuthTokenError extends Error {}
export class MalformedAuthTokenError extends Error {}
export class ExpiredAuthTokenError extends Error {}

export interface TokenPayload {
    userId: string;
    tokenId: string;
}

export async function generateToken(db: Kysely<Database>, userId: string) {
    const token = await insertToken(db, userId);

    const tokenPayload: TokenPayload = {
        userId,
        tokenId: token.id,
    };

    return jwt.sign(tokenPayload, config.authTokenSecret, {
        expiresIn: config.authTokenExpiryDuration,
    });
}

export async function validateToken(db: Kysely<Database>, token: string) {
    const payload = verifyToken(token);

    if (validatePayload(payload)) {
        const storedToken = await findTokenById(db, payload.tokenId);

        if (!storedToken || storedToken.user_id !== payload.userId) {
            throw new InvalidAuthTokenError();
        }

        return payload;
    } else {
        throw new InvalidAuthTokenError();
    }
}

export function validatePayload(
    payload: string | JwtPayload
): payload is TokenPayload {
    if (
        !payload ||
        typeof payload !== "object" ||
        typeof payload.userId !== "string" ||
        typeof payload.tokenId !== "string"
    ) {
        return false;
    }

    return true;
}

export function verifyToken(token: string) {
    try {
        return jwt.verify(token, config.authTokenSecret);
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            throw new ExpiredAuthTokenError();
        }

        throw new InvalidAuthTokenError();
    }
}
