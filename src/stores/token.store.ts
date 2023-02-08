import { Kysely } from "kysely";
import { Database } from "../database";

export async function insertToken(db: Kysely<Database>, userId: string) {
    return await db
        .insertInto("user_token")
        .values({ user_id: userId })
        .returningAll()
        .executeTakeFirstOrThrow();
}

export async function findTokenById(db: Kysely<Database>, tokenId: string) {
    return await db
        .selectFrom("user_token")
        .selectAll()
        .where("user_token.id", "=", tokenId)
        .executeTakeFirst();
}

export async function deleteToken(db: Kysely<Database>, tokenId: string) {
    await db
        .deleteFrom("user_token")
        .where("user_token.id", "=", tokenId)
        .execute();
}
