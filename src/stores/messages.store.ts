import { Kysely } from "kysely";
import { Database } from "../database";

export async function findMessagesByConversationId(
  db: Kysely<Database>,
  conversationId: string
) {
  return await db
    .selectFrom("conversation_message as m")
    .innerJoin("user_account", "user_account.user_id", "m.created_by")
    .selectAll()
    .where("m.conversation_id", "=", conversationId)
    .orderBy("m.created_at", "desc")
    .execute();
}
