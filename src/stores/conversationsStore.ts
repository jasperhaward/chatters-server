import { Kysely, sql } from "kysely";

import { WithCreatedByUsername } from "../types";
import { Database, ConversationRow } from "../database";
import { TBaseConversation } from "../schema";

export function toConversationSchema(
  row: WithCreatedByUsername<ConversationRow>
): TBaseConversation {
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

/** 
 * Note: orders conversations by latest message (if there is one), 
 * or the conversation created_at timestamp. Query equivalent of:
  ```sql
  WITH user_conversation AS (
      SELECT conversation_id 
      FROM conversation_recipient 
      WHERE user_id = 'd2cb5104-8bbc-488b-b323-f4a063e135ee'
  ), latest_message AS (
    SELECT MAX(created_at) AS created_at, m.conversation_id 
    FROM conversation_message AS m 
    INNER JOIN user_conversation ON user_conversation.conversation_id = m.conversation_id 
    GROUP BY m.conversation_id
  )
  SELECT c.*, u.username AS created_by_username
  FROM user_conversation AS uc 
  INNER JOIN conversation AS c 
    ON c.conversation_id = uc.conversation_id
  INNER JOIN user_account AS u 
    ON u.user_id = c.created_by
  LEFT JOIN latest_message AS lm 
    ON lm.conversation_id = c.conversation_id
  ORDER BY GREATEST(lm.created_at, c.created_at) DESC
  ```
 */
export async function findConversationsByUserId(
  db: Kysely<Database>,
  userId: string
): Promise<TBaseConversation[]> {
  const { max } = db.fn;

  const conversations = await db
    // conversation ids where the user is a recipient
    .with("user_conversation", (db) =>
      db
        .selectFrom("conversation_recipient")
        .select("conversation_id")
        .where("user_id", "=", userId)
    )
    // most recent message (if there are messages) for each of those conversation ids
    .with("latest_message", (db) =>
      db
        .selectFrom("conversation_message as m")
        .innerJoin(
          "user_conversation",
          "user_conversation.conversation_id",
          "m.conversation_id"
        )
        .select([max("created_at").as("created_at"), "m.conversation_id"])
        .groupBy("m.conversation_id")
    )
    .selectFrom("user_conversation as uc")
    .innerJoin("conversation as c", "c.conversation_id", "uc.conversation_id")
    .innerJoin("user_account as u", "u.user_id", "c.created_by")
    .leftJoin("latest_message as lm", "lm.conversation_id", "c.conversation_id")
    .selectAll("c")
    .select("u.username as created_by_username")
    // 'lm' may be null (as a conversation may have 0 messages), then order on conversation created_at
    .orderBy(sql`greatest(lm.created_at, c.created_at)`, "desc")
    .execute();

  return conversations.map(toConversationSchema);
}

export interface InsertConversationParams {
  createdBy: string;
  title: string | undefined;
}

export async function insertConversation(
  db: Kysely<Database>,
  params: InsertConversationParams
): Promise<TBaseConversation> {
  const conversation = await db
    .with("c", (db) =>
      db
        .insertInto("conversation")
        .values({
          created_by: params.createdBy,
          title: params.title,
        })
        .returningAll()
    )
    .selectFrom("c")
    .innerJoin("user_account as u", "u.user_id", "c.created_by")
    .selectAll("c")
    .select("u.username as created_by_username")
    .executeTakeFirstOrThrow();

  return toConversationSchema(conversation);
}
