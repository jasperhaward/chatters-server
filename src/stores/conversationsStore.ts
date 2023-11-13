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
  const { coalesce } = db.fn;

  const rows = await db
    .selectFrom("conversation_recipient as r")
    .innerJoin("conversation as c", "c.conversation_id", "r.conversation_id")
    .innerJoin("user_account as cu", "cu.user_id", "c.created_by")
    .leftJoin(
      "conversation_latest_message as m",
      "m.conversation_id",
      "c.conversation_id"
    )
    .leftJoin("user_account as mu", "mu.user_id", "m.latest_message_created_by")
    .selectAll("c")
    .select("cu.username as created_by_username")
    .selectAll("m")
    .select("cu.username as latest_message_created_by_username")
    .where("r.user_id", "=", userId)
    // order on conversation created_at if latest message is null
    .orderBy(
      coalesce("latest_message_created_at", "conversation.created_at"),
      "desc"
    )
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
