import { Kysely } from "kysely";
import { Database } from "../database";

export async function insertToken(db: Kysely<Database>, userId: string) {
  return await db
    .insertInto("user_token")
    .values({ user_id: userId })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function findTokenByTokenId(
  db: Kysely<Database>,
  tokenId: string
) {
  return await db
    .selectFrom("user_token")
    .selectAll()
    .where("user_token.token_id", "=", tokenId)
    .executeTakeFirst();
}

export async function deleteTokenByTokenId(
  db: Kysely<Database>,
  tokenId: string
) {
  await db
    .deleteFrom("user_token")
    .where("user_token.token_id", "=", tokenId)
    .execute();
}
