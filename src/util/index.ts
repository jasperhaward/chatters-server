import { TUser, TMessage } from "../schema";
import { UserRow, MessageRow } from "../tables";

export * from "./env";
export * from "./errors";

export function toUserSchmema(row: UserRow): TUser {
  return {
    id: row.user_id,
    username: row.username,
  };
}

export function toMessageSchmema(row: UserRow & MessageRow): TMessage {
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
