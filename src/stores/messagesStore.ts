import { Kysely } from "kysely";

import { isDatabaseErrorWithCode } from "../util";
import { Database, DatabaseErrorCode } from "../database";
import { MessageRowWithCreatedBy } from "../tables";

export class MessageLengthExceededError extends Error {}

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
): Promise<MessageRowWithCreatedBy> {
  return await db
    .with("m", (db) =>
      db
        .insertInto("conversation_message")
        .values({
          conversation_id: params.conversationId,
          created_by: params.createdBy,
          content: params.content,
        })
        .returningAll()
    )
    .selectFrom("m")
    .innerJoin("user_account as u", "u.user_id", "m.created_by")
    .selectAll("m")
    .select("u.username as created_by_username")
    .executeTakeFirstOrThrow()
    .catch((error) => {
      if (isDatabaseErrorWithCode(error, DatabaseErrorCode.ValueTooLong)) {
        throw new MessageLengthExceededError();
      }

      throw error;
    });
}
