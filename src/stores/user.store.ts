import { Kysely } from "kysely";
import { DatabaseError } from "pg";
import { Database, DatabaseErrorCode } from "../database";
import { InsertableUserRow } from "../tables/user.table";

export class UsernameNotUniqueError extends Error {}

export async function insertUser(
    db: Kysely<Database>,
    user: InsertableUserRow
) {
    try {
        return await db
            .insertInto("user_account")
            .values(user)
            .returningAll()
            .executeTakeFirstOrThrow();
    } catch (error) {
        if (
            error instanceof DatabaseError &&
            error.code === DatabaseErrorCode.UniqueViolation
        ) {
            throw new UsernameNotUniqueError();
        }

        throw error;
    }
}

export async function findUserByUsername(
    db: Kysely<Database>,
    username: string
) {
    return await db
        .selectFrom("user_account as user")
        .selectAll()
        .where("user.username", "=", username)
        .executeTakeFirst();
}

export async function findUserById(db: Kysely<Database>, id: string) {
    return await db
        .selectFrom("user_account as user")
        .selectAll()
        .where("user.id", "=", id)
        .executeTakeFirst();
}
