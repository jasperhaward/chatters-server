import { Kysely } from "kysely";
import { Database } from "../database";

export async function findRecipientsByConversationId(
  db: Kysely<Database>,
  conversationId: string
) {
  return await db
    .selectFrom("conversation_recipient as r")
    .innerJoin("user_account", "user_account.user_id", "r.user_id")
    .selectAll()
    .where("r.conversation_id", "=", conversationId)
    .execute();
}
