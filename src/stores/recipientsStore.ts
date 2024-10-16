import { Kysely, sql } from "kysely";

import { Database, InsertableRecipientRow, RecipientRow } from "../database";
import { TRecipient } from "../schema";

interface RecipientRowWithUsername extends RecipientRow {
  username: string;
}

function toRecipientSchema(row: RecipientRowWithUsername): TRecipient {
  return {
    id: row.user_id,
    conversationId: row.conversation_id,
    username: row.username,
    createdAt: row.created_at,
  };
}

export async function findRecipientsByConversationId(
  db: Kysely<Database>,
  conversationId: string
): Promise<TRecipient[]> {
  const rows = await db
    .selectFrom("conversation_recipient as r")
    .innerJoin("user_account as u", "u.user_id", "r.user_id")
    .selectAll("r")
    .select("u.username")
    .where("r.conversation_id", "=", conversationId)
    .orderBy("u.username")
    .execute();

  return rows.map(toRecipientSchema);
}

export async function isExistingConversationWithRecipientIds(
  db: Kysely<Database>,
  recipientIds: string[]
) {
  const { count } = db.fn;

  const joinedRecipientIds = sql.join(recipientIds);

  return !!(await db
    .selectFrom("conversation_recipient")
    .select("conversation_id")
    .groupBy("conversation_id")
    .having(count("user_id"), "=", recipientIds.length)
    .having(
      sql`sum(case when user_id in (${joinedRecipientIds}) then 0 else 1 end)`,
      "=",
      0
    )
    .executeTakeFirst());
}

export function isUserInRecipients(recipients: TRecipient[], userId: string) {
  return !!recipients.find((recipient) => recipient.id === userId);
}

export interface DeleteRecipientParams {
  conversationId: string;
  recipientId: string;
}

export async function deleteRecipient(
  db: Kysely<Database>,
  params: DeleteRecipientParams
) {
  const { conversationId, recipientId } = params;

  await db
    .deleteFrom("conversation_recipient")
    .where("conversation_id", "=", conversationId)
    .where("user_id", "=", recipientId)
    .execute();
}

export interface InsertRecipientsParams {
  conversationId: string;
  recipientIds: string[];
}

export async function insertRecipients(
  db: Kysely<Database>,
  params: InsertRecipientsParams
): Promise<TRecipient[]> {
  const { conversationId, recipientIds } = params;

  const values = recipientIds.map<InsertableRecipientRow>((recipientId) => ({
    conversation_id: conversationId,
    user_id: recipientId,
  }));

  const rows = await db
    .with("r", (db) =>
      db.insertInto("conversation_recipient").values(values).returningAll()
    )
    .selectFrom("r")
    .innerJoin("user_account as u", "u.user_id", "r.user_id")
    .selectAll("r")
    .select("u.username")
    .orderBy("u.username")
    .execute();

  return rows.map(toRecipientSchema);
}

export function sortRecipientsByUsername(a: TRecipient, b: TRecipient) {
  if (a.username === b.username) {
    return 0;
  }

  return a.username < b.username ? -1 : 1;
}
