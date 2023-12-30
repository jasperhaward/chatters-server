import { Kysely } from "kysely";

import {
  Database,
  ConversationRow,
  InsertableConversationRow,
} from "../database";
import { Nullable } from "../types";
import {
  TConversation,
  TConversationWithRecipientsAndLatestMessage,
} from "../schema";

interface ConversationRowWithCreatedBy extends ConversationRow {
  created_by_username: string;
}

function toConversationSchema(
  row: ConversationRowWithCreatedBy
): TConversation {
  return {
    id: row.conversation_id,
    createdAt: row.created_at,
    createdBy: {
      id: row.created_by,
      username: row.created_by_username,
    },
    title: row.title,
  };
}

interface LatestMessageRow {
  latest_message_id: string;
  latest_message_created_at: string;
  latest_message_created_by: string;
  latest_message_created_by_username: string;
  latest_message_content: string;
}

function hasLatestMessage(
  row: ConversationRowWithCreatedBy & Partial<Nullable<LatestMessageRow>>
): row is ConversationRowWithCreatedBy & LatestMessageRow {
  return !!row.latest_message_id;
}

type TConversationWithLatestMessage = Omit<
  TConversationWithRecipientsAndLatestMessage,
  "recipients"
>;

function toConversationWithLatestMessageSchema(
  row: ConversationRowWithCreatedBy & Partial<Nullable<LatestMessageRow>>
): TConversationWithLatestMessage {
  return {
    ...toConversationSchema(row),
    latestMessage: hasLatestMessage(row)
      ? {
          id: row.latest_message_id,
          conversationId: row.conversation_id,
          createdAt: row.latest_message_created_at,
          createdBy: {
            id: row.latest_message_created_by,
            username: row.latest_message_created_by_username,
          },
          content: row.latest_message_content,
        }
      : null,
  };
}

export function removeRecipientFromConversation(
  conversation: TConversationWithRecipientsAndLatestMessage,
  recipientId: string
): TConversationWithRecipientsAndLatestMessage {
  return {
    ...conversation,
    recipients: conversation.recipients.filter((recipient) => {
      return recipient.id !== recipientId;
    }),
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

export async function findConversationById(
  db: Kysely<Database>,
  conversationId: string
): Promise<TConversationWithLatestMessage> {
  const conversation = await db
    .selectFrom("conversation as c")
    .innerJoin("user_account as cu", "cu.user_id", "c.created_by")
    .leftJoin(
      "conversation_latest_message as lm",
      "lm.conversation_id",
      "c.conversation_id"
    )
    .leftJoin("user_account as lmu", "lmu.user_id", "lm.created_by")
    .select([
      "c.conversation_id",
      "c.created_at",
      "c.created_by",
      "cu.username as created_by_username",
      "c.title",
      "lm.id as latest_message_id",
      "lm.created_at as latest_message_created_at",
      "lm.created_by as latest_message_created_by",
      "lmu.username as latest_message_created_by_username",
      "lm.content as latest_message_content",
    ])
    .where("c.conversation_id", "=", conversationId)
    .executeTakeFirstOrThrow();

  return toConversationWithLatestMessageSchema(conversation);
}

export async function findConversationsByUserId(
  db: Kysely<Database>,
  userId: string
): Promise<TConversationWithLatestMessage[]> {
  const rows = await db
    .selectFrom("conversation_recipient as r")
    .innerJoin("conversation as c", "c.conversation_id", "r.conversation_id")
    .innerJoin("user_account as cu", "cu.user_id", "c.created_by")
    .leftJoin(
      "conversation_latest_message as lm",
      "lm.conversation_id",
      "c.conversation_id"
    )
    .leftJoin("user_account as lmu", "lmu.user_id", "lm.created_by")
    .select([
      "c.conversation_id",
      "c.created_at",
      "c.created_by",
      "cu.username as created_by_username",
      "c.title",
      "lm.id as latest_message_id",
      "lm.created_at as latest_message_created_at",
      "lm.created_by as latest_message_created_by",
      "lmu.username as latest_message_created_by_username",
      "lm.content as latest_message_content",
    ])
    .where("r.user_id", "=", userId)
    .orderBy((qb) => qb.fn.coalesce("lm.created_at", "c.created_at"), "desc")
    .execute();

  return rows.map(toConversationWithLatestMessageSchema);
}

export interface InsertConversationParams {
  createdBy: string;
  title: string | undefined;
}

export async function insertConversation(
  db: Kysely<Database>,
  params: InsertConversationParams
): Promise<TConversation> {
  const values: InsertableConversationRow = {
    created_by: params.createdBy,
    title: params.title,
  };

  const row = await db
    .with("c", (db) =>
      db.insertInto("conversation").values(values).returningAll()
    )
    .selectFrom("c")
    .innerJoin("user_account as u", "u.user_id", "c.created_by")
    .selectAll("c")
    .select("u.username as created_by_username")
    .executeTakeFirstOrThrow();

  return toConversationSchema(row);
}

export interface UpdateConversationParams {
  conversationId: string;
  title: string | null;
}

export async function updateConversation(
  db: Kysely<Database>,
  params: UpdateConversationParams
): Promise<TConversation> {
  const { conversationId, title } = params;

  const row = await db
    .with("c", (db) =>
      db
        .updateTable("conversation")
        .set({ title })
        .where("conversation_id", "=", conversationId)
        .returningAll()
    )
    .selectFrom("c")
    .innerJoin("user_account as u", "u.user_id", "c.created_by")
    .selectAll("c")
    .select("u.username as created_by_username")
    .executeTakeFirstOrThrow();

  return toConversationSchema(row);
}
