import { Kysely, sql } from "kysely";

import { Database } from "../database";
import { TConversationWithoutRecipients } from "../schema";

interface ConversationRow {
  conversation_id: string;
  created_at: string;
  created_by: string;
  created_by_username: string;
  title: string | null;
  latest_message_id: number | null;
  latest_message_created_at: string | null;
  latest_message_created_by: string | null;
  latest_message_created_by_username: string | null;
  latest_message_content: string | null;
}

function toConversationSchema(
  row: ConversationRow
): TConversationWithoutRecipients {
  return {
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
  };
}

export async function isExistingConversation(
  db: Kysely<Database>,
  conversationId: string
): Promise<boolean> {
  return !!(await db
    .selectFrom("conversation_creation_es")
    .where("conversation_id", "=", conversationId)
    .selectAll()
    .executeTakeFirst());
}

export async function findConversationByConversationId(
  db: Kysely<Database>,
  conversationId: string
): Promise<TConversationWithoutRecipients | null> {
  const row = await db
    .selectFrom("conversation_creation_es as c")
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
    .select([
      "c.conversation_id",
      "c.created_at",
      "c.created_by",
      "c.created_by_username",
      "t.title",
      "m.id as latest_message_id",
      "m.created_at as latest_message_created_at",
      "m.created_by as latest_message_created_by",
      "m.created_by_username as latest_message_created_by_username",
      "m.message as latest_message_content",
    ])
    .where("c.conversation_id", "=", conversationId)
    .executeTakeFirst();

  if (!row) {
    return null;
  }

  return toConversationSchema(row);
}

export async function findConversationsByUserId(
  db: Kysely<Database>,
  userId: string
): Promise<TConversationWithoutRecipients[]> {
  const { max } = db.fn;

  const rows = await db
    .selectFrom("conversation_recipient_es as ur")
    .innerJoin(
      "conversation_creation_es as c",
      "c.conversation_id",
      "ur.conversation_id"
    )
    .innerJoin(
      db
        .selectFrom("conversation_recipient_es")
        .select([max("created_at").as("max_created_at"), "conversation_id"])
        .groupBy("conversation_id")
        .as("r"),
      "r.conversation_id",
      "c.conversation_id"
    )
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
    .select([
      "c.conversation_id",
      "c.created_at",
      "c.created_by",
      "c.created_by_username",
      "t.title",
      "m.id as latest_message_id",
      "m.created_at as latest_message_created_at",
      "m.created_by as latest_message_created_by",
      "m.created_by_username as latest_message_created_by_username",
      "m.message as latest_message_content",
    ])
    .where("ur.recipient_id", "=", userId)
    .orderBy(
      sql`greatest(c.created_at, t.created_at, r.max_created_at, m.created_at)`,
      "desc"
    )
    .execute();

  return rows.map(toConversationSchema);
}
