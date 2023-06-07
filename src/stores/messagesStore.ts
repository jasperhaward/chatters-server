import { Kysely } from "kysely";
import { Database } from "../database";
import { MessageRowWithCreatedBy } from "../tables";

export async function findMessagesByConversationId(
  db: Kysely<Database>,
  conversationId: string
): Promise<MessageRowWithCreatedBy[]> {
  return await db
    .selectFrom("conversation_message as m")
    .innerJoin("user_account as u", "u.user_id", "m.created_by")
    .selectAll("m")
    .select("u.username as created_by_username")
    .where("m.conversation_id", "=", conversationId)
    .orderBy("m.created_at", "desc")
    .execute();
}

export interface InsertMessageParams {
  conversationId: string;
  createdBy: string;
  content: string;
}

export async function insertMessage(
  db: Kysely<Database>,
  params: InsertMessageParams
) {
  return await db
    .insertInto("conversation_message")
    .values({
      conversation_id: params.conversationId,
      created_by: params.createdBy,
      content: params.content,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}
