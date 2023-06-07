import { Insertable, Kysely } from "kysely";

import { Database, DatabaseErrorCode } from "../database";
import { UserTable } from "../tables";
import { isDatabaseErrorWithCode } from "../util";

export class UsernameNotUniqueError extends Error {}

export async function findUsersExceptUserId(
  db: Kysely<Database>,
  userId: string
) {
  return await db
    .selectFrom("user_account")
    .selectAll()
    .where("user_id", "!=", userId)
    .execute();
}

export async function findUserByUserId(db: Kysely<Database>, userId: string) {
  return await db
    .selectFrom("user_account")
    .selectAll()
    .where("user_id", "=", userId)
    .executeTakeFirstOrThrow();
}

export async function findUserByUsername(
  db: Kysely<Database>,
  username: string
) {
  return await db
    .selectFrom("user_account")
    .selectAll()
    .where("username", "=", username)
    .executeTakeFirst();
}

export async function insertUser(
  db: Kysely<Database>,
  values: Insertable<UserTable>
) {
  return await db
    .insertInto("user_account")
    .values(values)
    .returningAll()
    .executeTakeFirstOrThrow()
    .catch((error) => {
      if (isDatabaseErrorWithCode(error, DatabaseErrorCode.UniqueViolation)) {
        throw new UsernameNotUniqueError();
      }

      throw error;
    });
}
