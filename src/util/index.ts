import { TUser, TMessage } from "../schema";

import { UserRow } from "../tables/userAccount.table";
import { ConversationMessageRow } from "../tables/conversationMessage.table";
import { ConversationRecipientRow } from "../tables/conversationRecipient.table";

export * from "./env";
export * from "./errors";

export function toUserSchmema(row: UserRow & ConversationRecipientRow): TUser {
  return {
    id: row.user_id,
    username: row.username,
  };
}

export function toMessageSchmema(
  row: UserRow & ConversationMessageRow
): TMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    content: row.content,
    createdAt: row.created_at,
    createdBy: {
      id: row.user_id,
      username: row.username,
    },
  };
}
