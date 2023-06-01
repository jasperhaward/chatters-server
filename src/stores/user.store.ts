import { Kysely } from "kysely";
import { DatabaseError } from "pg";
import { Database, DatabaseErrorCode } from "../database";
import { TUserWithPassword } from "../schema/User";
import { InsertableUserRow } from "../tables/userAccount.table";

export class UsernameNotUniqueError extends Error {}

export async function insertUser(
  db: Kysely<Database>,
  values: InsertableUserRow
): Promise<TUserWithPassword> {
  try {
    const user = await db
      .insertInto("user_account")
      .values(values)
      .returningAll()
      .executeTakeFirstOrThrow();

    return {
      id: user.user_id,
      username: user.username,
      password: user.password,
    };
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
    .where("user.user_id", "=", id)
    .executeTakeFirst();
}
