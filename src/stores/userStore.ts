import { Kysely } from "kysely";

import { Database, InsertableUserRow, UserRow } from "../database";
import { TUserWithCreatedAt } from "../schema";

interface TUserWithPassword extends TUserWithCreatedAt {
  password: string;
}

function toUserSchema(row: UserRow): TUserWithCreatedAt {
  return {
    id: row.user_id,
    username: row.username,
    createdAt: row.created_at,
  };
}

export async function findUsers(
  db: Kysely<Database>
): Promise<TUserWithCreatedAt[]> {
  const rows = await db.selectFrom("user_account").selectAll().execute();

  return rows.map(toUserSchema);
}

export async function findUsersByUserIds(
  db: Kysely<Database>,
  userIds: string[]
): Promise<TUserWithCreatedAt[]> {
  const rows = await db
    .selectFrom("user_account")
    .selectAll()
    .where("user_id", "in", userIds)
    .execute();

  return rows.map(toUserSchema);
}

export async function findUserByUsername(
  db: Kysely<Database>,
  username: string
): Promise<TUserWithPassword | null> {
  const row = await db
    .selectFrom("user_account")
    .selectAll()
    .where("username", "=", username)
    .executeTakeFirst();

  if (!row) {
    return null;
  }

  return {
    ...toUserSchema(row),
    password: row.password,
  };
}

export async function findUserByUserId(
  db: Kysely<Database>,
  userId: string
): Promise<TUserWithCreatedAt | null> {
  const row = await db
    .selectFrom("user_account")
    .selectAll()
    .where("user_id", "=", userId)
    .executeTakeFirst();

  if (!row) {
    return null;
  }

  return toUserSchema(row);
}

export interface InsertUserParams {
  username: string;
  hashedPassword: string;
}

export async function insertUser(
  db: Kysely<Database>,
  params: InsertUserParams
): Promise<TUserWithCreatedAt> {
  const values: InsertableUserRow = {
    username: params.username,
    password: params.hashedPassword,
  };

  const row = await db
    .insertInto("user_account")
    .values(values)
    .returningAll()
    .executeTakeFirstOrThrow();

  return toUserSchema(row);
}
