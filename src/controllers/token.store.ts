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
        .selectFrom("user_token as token")
        .selectAll()
        .where("token.id", "=", tokenId)
        .executeTakeFirst();
}
