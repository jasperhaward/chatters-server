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
  const users = await db
    .selectFrom("user_account")
    .selectAll()
    .execute();

  return users.map(toUserSchema);
}

export async function findUsersByUserIds(
  db: Kysely<Database>,
  userIds: string[]
): Promise<TUser[]> {
  const users = await db
    .selectFrom("user_account")
    .selectAll()
    .where("user_id", "in", userIds)
    .execute();

  return users.map(toUserSchema);
}

export async function isExistingUser(
  db: Kysely<Database>,
  userId: string
): Promise<boolean> {
  return !!(await db
    .selectFrom("user_account")
    .selectAll()
    .where("user_id", "=", userId)
    .executeTakeFirstOrThrow());
}

export async function findUserByUsername(
  db: Kysely<Database>,
  username: string
): Promise<TUserWithPassword | null> {
  const user = await db
    .selectFrom("user_account")
    .selectAll()
    .where("username", "=", username)
    .executeTakeFirst();

  if (!user) {
    return null;
  }

  return {
    ...toUserSchema(user),
    createdAt: user.created_at,
    password: user.password,
  };
}

export interface InsertUserParams {
  username: string;
  hashedPassword: string;
}

export async function insertUser(
  db: Kysely<Database>,
  params: InsertUserParams
): Promise<TUserWithCreatedAt> {
  const user = await db
    .insertInto("user_account")
    .values({
      username: params.username,
      password: params.hashedPassword,
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  return {
    ...toUserSchema(user),
    createdAt: user.created_at,
  };
}
