import { Kysely } from "kysely";
import jwt, { JwtPayload, TokenExpiredError } from "jsonwebtoken";

import config from "../config";
import { Database } from "../database";
import { insertToken, findTokenByTokenId } from "../stores";

export class InvalidAuthTokenError extends Error {}
export class ExpiredAuthTokenError extends Error {}

export interface TokenPayload {
  createdAt: string;
  userId: string;
  tokenId: string;
}

export async function generateToken(db: Kysely<Database>, userId: string) {
  const token = await insertToken(db, userId);

  return jwt.sign(token, config.authTokenSecret, {
    expiresIn: config.authTokenExpiryDuration,
  });
}

/** Removes authentication scheme. */
export function removeTokenScheme(token: string) {
  return token.substring("Bearer ".length);
}

export async function validateToken(db: Kysely<Database>, token: string) {
  const payload = verifyToken(token);

  if (isValidTokenPayload(payload)) {
    const storedToken = await findTokenByTokenId(db, payload.tokenId);

    if (!storedToken || storedToken.userId !== payload.userId) {
      throw new InvalidAuthTokenError();
    }

    return payload;
  } else {
    throw new InvalidAuthTokenError();
  }
}

export function isValidTokenPayload(
  payload: string | JwtPayload
): payload is TokenPayload {
  if (
    !payload ||
    typeof payload !== "object" ||
    typeof payload.createdAt !== "string" ||
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
