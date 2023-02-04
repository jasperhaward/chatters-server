import { Kysely } from "kysely";
import jwt, { TokenExpiredError } from "jsonwebtoken";

import config from "../config";
import { Database } from "../database";
import { insertToken, findTokenById } from "./token.store";

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

export async function verifyToken(db: Kysely<Database>, token: string) {
    const tokenPayload = decodeToken(token);

    const storedToken = await findTokenById(db, tokenPayload.tokenId);

    if (!storedToken || storedToken.user_id !== tokenPayload.userId) {
        throw new InvalidAuthTokenError();
    }

    return true;
}

export function decodeToken(token: string): TokenPayload {
    try {
        const payload = jwt.verify(token, config.authTokenSecret);

        if (
            !payload ||
            typeof payload !== "object" ||
            typeof payload.userId !== "string" ||
            typeof payload.tokenId !== "string"
        ) {
            throw new MalformedAuthTokenError();
        }

        return payload as TokenPayload;
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            throw new ExpiredAuthTokenError();
        }

        throw error;
    }
}
