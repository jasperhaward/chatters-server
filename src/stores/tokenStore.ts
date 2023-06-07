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
    .where("token_id", "=", tokenId)
    .executeTakeFirst();
}

export async function deleteTokenByTokenId(
  db: Kysely<Database>,
  tokenId: string
) {
  // prettier-ignore
  await db
    .deleteFrom("user_token")
    .where("token_id", "=", tokenId)
    .execute();
}
