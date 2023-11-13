import { Kysely } from "kysely";

import { Database, InsertableMessageRow, MessageRow } from "../database";
import { TMessage } from "../schema";

interface MessageRowWithCreatedBy extends MessageRow {
  created_by_username: string;
}

function toMessageSchema(row: MessageRowWithCreatedBy): TMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    content: row.content,
    createdAt: row.created_at,
    createdBy: {
      id: row.created_by,
      username: row.created_by_username,
    },
  };
}

export async function findMessagesByConversationId(
  db: Kysely<Database>,
  conversationId: string
): Promise<TMessage[]> {
  const rows = await db
    .selectFrom("conversation_message as m")
    .innerJoin("user_account as u", "u.user_id", "m.created_by")
    .selectAll("m")
    .select("u.username as created_by_username")
    .where("m.conversation_id", "=", conversationId)
    .orderBy("m.created_at", "desc")
    .execute();

  return rows.map(toMessageSchema);
}

export interface InsertMessageParams {
  conversationId: string;
  createdBy: string;
  content: string;
}

export async function insertMessage(
  db: Kysely<Database>,
  params: InsertMessageParams
): Promise<TMessage> {
  const values: InsertableMessageRow = {
    conversation_id: params.conversationId,
    created_by: params.createdBy,
    content: params.content,
  };

  const row = await db
    .with("m", (db) =>
      db.insertInto("conversation_message").values(values).returningAll()
    )
    .selectFrom("m")
    .innerJoin("user_account as u", "u.user_id", "m.created_by")
    .selectAll("m")
    .select("u.username as created_by_username")
    .executeTakeFirstOrThrow();

  return toMessageSchema(row);
}
