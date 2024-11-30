import { Kysely, sql } from "kysely";

import { Database, RecipientRow } from "../database";
import { TRecipient } from "../schema";

function toRecipientSchema(row: RecipientRow): TRecipient {
  return {
    id: row.recipient_id,
    username: row.recipient_username,
    createdAt: row.created_at,
    createdBy: {
      id: row.created_by,
      username: row.created_by_username,
    },
  };
}

export async function isExistingConversationWithRecipientIds(
  db: Kysely<Database>,
  recipientIds: string[]
) {
  const { count } = db.fn;

  const joinedRecipientIds = sql.join(recipientIds);

  return !!(await db
    .selectFrom("conversation_recipient_es")
    .select("conversation_id")
    .groupBy("conversation_id")
    .having(count("recipient_id"), "=", recipientIds.length)
    .having(
      sql`sum(case when recipient_id in (${joinedRecipientIds}) then 0 else 1 end)`,
      "=",
      0
    )
    .executeTakeFirst());
}

export async function findRecipientsByConversationId(
  db: Kysely<Database>,
  conversationId: string
): Promise<TRecipient[]> {
  const rows = await db
    .selectFrom("conversation_recipient_es")
    .selectAll()
    .where("conversation_id", "=", conversationId)
    .orderBy("recipient_username")
    .execute();

  return rows.map(toRecipientSchema);
}

export function isUserInRecipients(recipients: TRecipient[], userId: string) {
  return recipients.some((recipient) => recipient.id === userId);
}
