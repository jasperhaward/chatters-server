import { TUser, TConversation, TMessage } from "../schema";
import {
  UserRow,
  ConversationRowWithCreatedBy,
  MessageRowWithCreatedBy,
  RecipientRowWithUsername,
} from "../tables";

export * from "./env";
export * from "./errors";

export function removeDuplicates(
  value: string,
  index: number,
  array: string[]
) {
  return array.indexOf(value) === index;
}

export function toUserSchema(row: UserRow | RecipientRowWithUsername): TUser {
  return {
    id: row.user_id,
    username: row.username,
  };
}

export function toConversationSchema(
  row: ConversationRowWithCreatedBy,
  recipients: RecipientRowWithUsername[],
  messages: MessageRowWithCreatedBy[]
): TConversation {
  return {
    id: row.conversation_id,
    createdAt: row.created_at,
    createdBy: {
      id: row.created_by,
      username: row.created_by_username,
    },
    title: row.title,
    recipients: recipients.map(toUserSchema),
    messages: messages.map(toMessageSchema),
  };
}

export function toMessageSchema(row: MessageRowWithCreatedBy): TMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    content: row.content,
    createdAt: row.created_at,
    createdBy: {
      id: row.created_by,
      username: row.created_by_username,
    },
  };
}
