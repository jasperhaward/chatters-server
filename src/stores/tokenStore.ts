import { Kysely } from "kysely";

import { Database, InsertableTokenRow, TokenRow } from "../database";
import { TokenPayload } from "../services";

function toTokenPayload(row: TokenRow): TokenPayload {
  return {
    createdAt: row.created_at,
    tokenId: row.token_id,
    userId: row.user_id,
  };
}

export async function findTokenByTokenId(
  db: Kysely<Database>,
  tokenId: string
): Promise<TokenPayload | null> {
  const row = await db
    .selectFrom("user_token")
    .selectAll()
    .where("token_id", "=", tokenId)
    .executeTakeFirst();

  if (!row) {
    return null;
  }

  return toTokenPayload(row);
}

export async function deleteTokenByTokenId(
  db: Kysely<Database>,
  tokenId: string
) {
  await db.deleteFrom("user_token").where("token_id", "=", tokenId).execute();
}

export async function insertToken(
  db: Kysely<Database>,
  userId: string
): Promise<TokenPayload> {
  const values: InsertableTokenRow = {
    user_id: userId,
  };

  const row = await db
    .insertInto("user_token")
    .values(values)
    .returningAll()
    .executeTakeFirstOrThrow();

  return toTokenPayload(row);
}
