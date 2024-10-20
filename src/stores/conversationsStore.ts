import { Kysely, sql } from "kysely";

import { Database } from "../database";
import { TConversation } from "../schema";

export async function isExistingConversation(
  db: Kysely<Database>,
  conversationId: string
): Promise<boolean> {
  return !!(await db
    .selectFrom("conversation_event")
    .where("conversation_id", "=", conversationId)
    .selectAll()
    .executeTakeFirst());
}

type TConversationEsWithoutRecipients = Omit<TConversation, "recipients">;

export async function findConversationsByUserIdEs(
  db: Kysely<Database>,
  userId: string
): Promise<TConversationEsWithoutRecipients[]> {
  const rows = await db
    .selectFrom("conversation_recipient_es as r")
    .innerJoin(
      "conversation_creation_es as c",
      "c.conversation_id",
      "r.conversation_id"
    )
    .innerJoin("user_account as cu", "cu.user_id", "c.created_by")
    .leftJoin(
      "conversation_title_es as t",
      "t.conversation_id",
      "c.conversation_id"
    )
    .leftJoin(
      "conversation_latest_message_es as m",
      "m.conversation_id",
      "c.conversation_id"
    )
    .leftJoin("user_account as mu", "mu.user_id", "m.created_by")
    .select([
      "c.conversation_id",
      "c.created_at",
      "c.created_by",
      "cu.username as created_by_username",
      "t.title",
      "m.id as latest_message_id",
      "m.created_at as latest_message_created_at",
      "m.created_by as latest_message_created_by",
      "mu.username as latest_message_created_by_username",
      "m.message as latest_message_content",
    ])
    .where("r.recipient_id", "=", userId)
    .orderBy(
      sql`greatest(c.created_at, t.created_at, r.created_at, m.created_at)`,
      "desc"
    )
    .execute();

  return rows.map((row) => ({
    conversationId: row.conversation_id,
    createdAt: row.created_at,
    createdBy: {
      id: row.created_by,
      username: row.created_by_username,
    },
    title: row.title,
    latestMessage: row.latest_message_id
      ? {
          id: row.latest_message_id!,
          content: row.latest_message_content!,
          createdAt: row.latest_message_created_at!,
          createdBy: {
            id: row.latest_message_created_by!,
            username: row.latest_message_created_by_username!,
          },
        }
      : null,
  }));
}
