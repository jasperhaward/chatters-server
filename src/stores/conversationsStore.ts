import { Kysely } from "kysely";

import { Database } from "../database";
import { TConversationWithoutRecipients } from "../schema";
import {
  ConversationEventRowWithJoins,
  toConversationEventSchema,
} from "./eventsStore";

interface ConversationRowWithLatestEvent extends ConversationEventRowWithJoins {
  conversation_conversation_id: string;
  conversation_created_at: string;
  conversation_created_by: string;
  conversation_created_by_username: string;
  conversation_title: string | null;
}

function toConversationSchema(
  row: ConversationRowWithLatestEvent
): TConversationWithoutRecipients {
  return {
    conversationId: row.conversation_conversation_id,
    createdAt: row.conversation_created_at,
    createdBy: {
      id: row.conversation_created_by,
      username: row.conversation_created_by_username,
    },
    title: row.conversation_title,
    latestEvent: toConversationEventSchema(row),
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
    .innerJoin(
      "conversation_latest_event_es as e",
      "e.conversation_id",
      "c.conversation_id"
    )
    .select([
      "c.conversation_id as conversation_conversation_id",
      "c.created_at as conversation_created_at",
      "c.created_by as conversation_created_by",
      "c.created_by_username as conversation_created_by_username",
      "t.title as conversation_title",
      "e.id",
      "e.conversation_id",
      "e.event_type",
      "e.created_at",
      "e.created_by",
      "e.created_by_username",
      "e.message",
      "e.title",
      "e.recipient_id",
      "e.recipient_username",
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
  const rows = await db
    .selectFrom("conversation_recipient_es as r")
    .innerJoin(
      "conversation_creation_es as c",
      "c.conversation_id",
      "r.conversation_id"
    )
    .leftJoin(
      "conversation_title_es as t",
      "t.conversation_id",
      "c.conversation_id"
    )
    .innerJoin(
      "conversation_latest_event_es as e",
      "e.conversation_id",
      "c.conversation_id"
    )
    .select([
      "c.conversation_id as conversation_conversation_id",
      "c.created_at as conversation_created_at",
      "c.created_by as conversation_created_by",
      "c.created_by_username as conversation_created_by_username",
      "t.title as conversation_title",
      "e.id",
      "e.conversation_id",
      "e.event_type",
      "e.created_at",
      "e.created_by",
      "e.created_by_username",
      "e.message",
      "e.title",
      "e.recipient_id",
      "e.recipient_username",
    ])
    .where("r.recipient_id", "=", userId)
    .orderBy("e.created_at", "desc")
    .execute();

  return rows.map(toConversationSchema);
}
