import { Kysely } from "kysely";

import { isDatabaseErrorWithCode } from "../util";
import { Database, DatabaseErrorCode } from "../database";
import { RecipientRowWithUsername } from "../tables";

export class RecipientNotFoundError extends Error {}

/** Gets recipients for a conversation, excluding the current user. */
export async function findRecipientsByConversationId(
  db: Kysely<Database>,
  conversationId: string,
  userId: string
): Promise<RecipientRowWithUsername[]> {
  return await db
    .selectFrom("conversation_recipient as r")
    .innerJoin("user_account as u", "u.user_id", "r.user_id")
    .selectAll("r")
    .select("u.username")
    .where("r.conversation_id", "=", conversationId)
    .where("r.user_id", "!=", userId)
    .execute();
}

export async function isRecipientInConversation(
  db: Kysely<Database>,
  recipientId: string,
  conversationId: string
) {
  return !!(await db
    .selectFrom("conversation_recipient")
    .selectAll()
    .where("conversation_id", "=", conversationId)
    .where("user_id", "=", recipientId)
    .executeTakeFirst());
}

export async function findConversationsByRecipientIds(
  db: Kysely<Database>,
  recipientIds: string[]
) {
  const { count } = db.fn;

  return await db
    .selectFrom("conversation_recipient")
    .select("conversation_id")
    .where("user_id", "in", recipientIds)
    .groupBy("conversation_id")
    .having(count("user_id"), "=", recipientIds.length)
    .execute();
}

export interface InsertRecipientsParams {
  conversationId: string;
  recipientIds: string[];
}

export async function insertRecipients(
  db: Kysely<Database>,
  params: InsertRecipientsParams
): Promise<RecipientRowWithUsername[]> {
  const { conversationId, recipientIds } = params;

  return await db
    .with("r", (db) =>
      db
        .insertInto("conversation_recipient")
        .values(
          recipientIds.map((recipientId) => ({
            conversation_id: conversationId,
            user_id: recipientId,
          }))
        )
        .returningAll()
    )
    .selectFrom("r")
    .innerJoin("user_account as u", "u.user_id", "r.user_id")
    .selectAll("r")
    .select("u.username")
    .execute()
    .catch((error) => {
      if (
        isDatabaseErrorWithCode(error, DatabaseErrorCode.ForeignKeyViolation)
      ) {
        throw new RecipientNotFoundError();
      }

      throw error;
    });
}

export interface DeleteRecipientParams {
  conversationId: string;
  recipientId: string;
}

export async function deleteRecipient(
  db: Kysely<Database>,
  params: DeleteRecipientParams
) {
  const { conversationId, recipientId } = params;

  return await db
    .deleteFrom("conversation_recipient")
    .where("conversation_id", "=", conversationId)
    .where("user_id", "=", recipientId)
    .execute();
}
