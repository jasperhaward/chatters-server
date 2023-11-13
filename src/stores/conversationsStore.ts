import { Kysely, sql } from "kysely";

import {
  Database,
  ConversationRow,
  InsertableConversationRow,
} from "../database";
import { TConversation } from "../schema";

export type TConversationWithoutRecipients = Omit<TConversation, "recipients">;

export interface ConversationRowWithJoins extends ConversationRow {
  created_by_username: string;
  latest_message_id?: string | null;
  latest_message_content?: string | null;
  latest_message_created_at?: string | null;
  latest_message_created_by?: string | null;
  latest_message_created_by_username?: string | null;
}

export interface ConversationRowWithLatestMessage
  extends ConversationRowWithJoins {
  latest_message_id: string;
  latest_message_content: string;
  latest_message_created_at: string;
  latest_message_created_by: string;
  latest_message_created_by_username: string;
}

export function hasLatestMessage(
  row: ConversationRowWithJoins
): row is ConversationRowWithLatestMessage {
  return !!row.latest_message_id;
}

export function toConversationSchema(
  row: ConversationRowWithJoins
): TConversationWithoutRecipients {
  return {
    id: row.conversation_id,
    createdAt: row.created_at,
    createdBy: {
      id: row.created_by,
      username: row.created_by_username,
    },
    title: row.title,
    latestMessage: hasLatestMessage(row)
      ? {
          id: row.latest_message_id,
          createdAt: row.latest_message_created_at,
          createdBy: {
            id: row.latest_message_created_by,
            username: row.latest_message_created_by_username,
          },
          conversationId: row.conversation_id,
          content: row.latest_message_content,
        }
      : null,
  };
}

export async function isExistingConversation(
  db: Kysely<Database>,
  conversationId: string
): Promise<boolean> {
  return !!(await db
    .selectFrom("conversation")
    .where("conversation_id", "=", conversationId)
    .selectAll()
    .executeTakeFirst());
}

export async function findConversationsByUserId(
  db: Kysely<Database>,
  userId: string
): Promise<TConversationWithoutRecipients[]> {
  const rows = await db
    // conversation ids where the user is a recipient
    .with("user_conversation_id", (db) =>
      db
        .selectFrom("conversation_recipient")
        .select("conversation_id")
        .where("user_id", "=", userId)
    )
    // most recent message if there is one for each of those conversation ids
    .with("latest_message", (db) =>
      db
        .selectFrom("user_conversation_id as uc")
        .innerJoin(
          "conversation_message as m",
          "m.conversation_id",
          "uc.conversation_id"
        )
        .innerJoin("user_account as u", "u.user_id", "m.created_by")
        .distinctOn("m.conversation_id")
        .select([
          "m.id as latest_message_id",
          "m.conversation_id as latest_message_conversation_id",
          "m.created_at as latest_message_created_at",
          "m.created_by as latest_message_created_by",
          "u.username as latest_message_created_by_username",
          "m.content as latest_message_content",
        ])
        .orderBy("m.conversation_id")
        .orderBy("m.created_at", "desc")
    )
    .selectFrom("user_conversation_id as uc")
    .innerJoin("conversation as c", "c.conversation_id", "uc.conversation_id")
    .innerJoin("user_account as u", "u.user_id", "c.created_by")
    .leftJoin(
      "latest_message as lm",
      "lm.latest_message_conversation_id",
      "c.conversation_id"
    )
    .selectAll("c")
    .selectAll("lm")
    .select("u.username as created_by_username")
    // the latest message may be null as a conversation may have
    // 0 messages, if so order on conversation created_at
    .orderBy(sql`greatest(lm.latest_message_created_at, c.created_at)`, "desc")
    .execute();

  return rows.map(toConversationSchema);
}

export interface InsertConversationParams {
  createdBy: string;
  title: string | undefined;
}

export async function insertConversation(
  db: Kysely<Database>,
  params: InsertConversationParams
): Promise<TConversationWithoutRecipients> {
  const values: InsertableConversationRow = {
    created_by: params.createdBy,
    title: params.title,
  };

  const row = await db
    .with("c", (db) =>
      // prettier-ignore
      db
        .insertInto("conversation")
        .values(values)
        .returningAll()
    )
    .selectFrom("c")
    .innerJoin("user_account as u", "u.user_id", "c.created_by")
    .selectAll("c")
    .select("u.username as created_by_username")
    .executeTakeFirstOrThrow();

  return toConversationSchema(row);
}
