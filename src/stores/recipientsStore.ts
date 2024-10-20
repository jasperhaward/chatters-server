import { Kysely, sql } from "kysely";

import { Database } from "../database";
import { TRecipient } from "../schema";

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
    .selectFrom("conversation_recipient_es as r")
    .innerJoin("user_account as u", "u.user_id", "r.recipient_id")
    .selectAll("r")
    .select("u.username")
    .where("r.conversation_id", "=", conversationId)
    .orderBy("u.username")
    .execute();

  return rows.map((row) => ({
    id: row.recipient_id,
    username: row.recipient_username,
    createdAt: row.created_at,
    createdBy: {
      id: row.created_by,
      username: row.created_by_username,
    },
  }));
}

export function isUserInRecipients(recipients: TRecipient[], userId: string) {
  return recipients.some((recipient) => recipient.id === userId);
}

export function sortRecipientsByUsername(a: TRecipient, b: TRecipient) {
  if (a.username === b.username) {
    return 0;
  }

  return a.username < b.username ? -1 : 1;
}
