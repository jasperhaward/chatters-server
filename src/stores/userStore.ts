import { Kysely } from "kysely";

import {
  Database,
  InsertableUserPasswordRow,
  UserAccountRow,
} from "../database";
import { TUser, TUserWithCreatedAt } from "../schema";

function toUserSchema(row: UserAccountRow): TUser {
  return {
    id: row.user_id,
    username: row.username,
  };
}

function toUserWithCreatedAtSchema(row: UserAccountRow): TUserWithCreatedAt {
  return {
    createdAt: row.created_at,
    ...toUserSchema(row),
  };
}

export async function findUsers(db: Kysely<Database>): Promise<TUser[]> {
  const rows = await db
    .selectFrom("user_account")
    .selectAll()
    .orderBy("username")
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

export async function findUserByUserId(
  db: Kysely<Database>,
  userId: string
): Promise<TUser | null> {
  const users = await findUsersByUserIds(db, [userId]);

  if (users.length === 0) {
    return null;
  }

  return users[0]!;
}

export async function findUserByUsername(
  db: Kysely<Database>,
  username: string
): Promise<TUserWithCreatedAt | null> {
  const row = await db
    .selectFrom("user_account")
    .selectAll()
    .where("username", "=", username)
    .executeTakeFirst();

  if (!row) {
    return null;
  }

  return toUserWithCreatedAtSchema(row);
}

export async function findUserPasswordHashByUserId(
  db: Kysely<Database>,
  userId: string
): Promise<string> {
  const row = await db
    .selectFrom("user_password")
    .selectAll()
    .where("user_id", "=", userId)
    .executeTakeFirstOrThrow();

  return row.password_hash;
}

export async function insertUser(
  db: Kysely<Database>,
  username: string
): Promise<TUserWithCreatedAt> {
  const row = await db
    .insertInto("user_account")
    .values({ username })
    .returningAll()
    .executeTakeFirstOrThrow();

  return toUserWithCreatedAtSchema(row);
}

export interface InsertUserPasswordParams {
  userId: string;
  passwordHash: string;
}

export async function insertUserPassword(
  db: Kysely<Database>,
  params: InsertUserPasswordParams
) {
  const values: InsertableUserPasswordRow = {
    user_id: params.userId,
    password_hash: params.passwordHash,
  };

  await db
    .insertInto("user_password")
    .values(values)
    .returningAll()
    .executeTakeFirstOrThrow();
}

export function sortUsersByUsername(a: TUser, b: TUser) {
  if (a.username === b.username) {
    return 0;
  }

  return a.username < b.username ? -1 : 1;
}
