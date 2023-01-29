import jwt, { TokenExpiredError, JwtPayload } from "jsonwebtoken";

import config from "../config";

export class InvalidAuthTokenError extends Error {}
export class ExpiredAuthTokenError extends Error {}

export function generateToken(userId: string) {
    return jwt.sign({ userId }, config.authTokenSecret, {
        expiresIn: config.authTokenExpiryDuration,
    });
}

export function verifyToken(token: string): string | JwtPayload {
    try {
        return jwt.verify(token, config.authTokenSecret);
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            throw new ExpiredAuthTokenError();
        }

        throw new InvalidAuthTokenError();
    }
}
