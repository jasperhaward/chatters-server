import { Kysely } from "kysely";
import { Database } from "../database";

/** Orders conversations by latest message first. */
export async function findConversationsByUserId(
  db: Kysely<Database>,
  userId: string
) {
  const { max } = db.fn;

  return await db
    .with("conversation_latest_message", (db) =>
      db
        .selectFrom("conversation_message")
        .select([max("created_at").as("created_at"), "conversation_id"])
        .groupBy("conversation_id")
    )
    .selectFrom("conversation as c")
    .select("c.conversation_id")
    .innerJoin(
      "conversation_recipient as r",
      "r.conversation_id",
      "c.conversation_id"
    )
    .innerJoin(
      "conversation_latest_message as lm",
      "lm.conversation_id",
      "c.conversation_id"
    )
    .where("r.user_id", "=", userId)
    .orderBy("lm.created_at", "desc")
    .execute();
}
