import { Kysely } from "kysely";
import { DatabaseError } from "pg";

import { Database, DatabaseErrorCode } from "../database";
import { InsertableUserRow } from "../tables";

export class UsernameNotUniqueError extends Error {}

export async function insertUser(
  db: Kysely<Database>,
  values: InsertableUserRow
) {
  try {
    return await db
      .insertInto("user_account")
      .values(values)
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
    .selectFrom("user_account as u")
    .selectAll()
    .where("u.username", "=", username)
    .executeTakeFirst();
}
