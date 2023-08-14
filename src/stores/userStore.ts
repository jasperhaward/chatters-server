import { Kysely } from "kysely";

import { Database, UserRow } from "../database";
import { TUser, TUserWithCreatedAt, TUserWithPassword } from "../schema";

export function toUserSchema(row: UserRow): TUser {
  return {
    id: row.user_id,
    username: row.username,
  };
}

export async function findUsers(db: Kysely<Database>): Promise<TUser[]> {
  // prettier-ignore
  const rows = await db
    .selectFrom("user_account")
    .selectAll()
    .execute();

  return rows.map(toUserSchema);
}

export async function findUsersByUserIds(
  db: Kysely<Database>,
  userIds: string[]
): Promise<TUser[]> {
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
    createdAt: row.created_at,
    password: row.password,
  };
}

export async function findUserByUserId(
  db: Kysely<Database>,
  userId: string
): Promise<TUser | null> {
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
  const row = await db
    .insertInto("user_account")
    .values({
      username: params.username,
      password: params.hashedPassword,
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  return {
    ...toUserSchema(row),
    createdAt: row.created_at,
  };
}
