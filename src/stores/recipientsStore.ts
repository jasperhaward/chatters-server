import { Kysely } from "kysely";

import { Database, InsertableRecipientRow, RecipientRow } from "../database";
import { TUser } from "../schema";

export interface RecipientRowWithUsername extends RecipientRow {
  username: string;
}

export function toRecipientSchema(row: RecipientRowWithUsername): TUser {
  return {
    id: row.user_id,
    username: row.username,
  };
}

export async function findRecipientsByConversationId(
  db: Kysely<Database>,
  conversationId: string
): Promise<TUser[]> {
  const rows = await db
    .selectFrom("conversation_recipient as r")
    .innerJoin("user_account as u", "u.user_id", "r.user_id")
    .selectAll("r")
    .select("u.username")
    .where("r.conversation_id", "=", conversationId)
    .orderBy("r.created_at")
    .execute();

  return rows.map(toRecipientSchema);
}

export function isRecipientInConversation(
  recipients: TUser[],
  recipientId: string
) {
  return !!recipients.find((recipient) => recipient.id === recipientId);
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
): Promise<TUser[]> {
  const { conversationId, recipientIds } = params;

  const values = recipientIds.map<InsertableRecipientRow>((recipientId) => ({
    conversation_id: conversationId,
    user_id: recipientId,
  }));

  const rows = await db
    .with("r", (db) =>
      // prettier-ignore
      db
        .insertInto("conversation_recipient")
        .values(values)
        .returningAll()
    )
    .selectFrom("r")
    .innerJoin("user_account as u", "u.user_id", "r.user_id")
    .selectAll("r")
    .select("u.username")
    .execute();

  return rows.map(toRecipientSchema);
}
