import { Kysely } from "kysely";
import { Database } from "../database";

export async function findUsers(db: Kysely<Database>) {
  // prettier-ignore
  return await db
    .selectFrom("user_account")
    .selectAll()
    .execute();
}

export async function findUsersByUserIds(
  db: Kysely<Database>,
  userIds: string[]
) {
  return await db
    .selectFrom("user_account")
    .selectAll()
    .where("user_id", "in", userIds)
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

export interface InsertUserParams {
  username: string;
  hashedPassword: string;
}

export async function insertUser(
  db: Kysely<Database>,
  params: InsertUserParams
) {
  return await db
    .insertInto("user_account")
    .values({
      username: params.username,
      password: params.hashedPassword,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}
