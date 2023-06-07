import { GeneratedAlways, Selectable } from "kysely";
import { WithCreatedBy } from "./types";

export interface UserTable {
  user_id: GeneratedAlways<string>;
  created_at: GeneratedAlways<string>;
  username: string;
  password: string;
}

export type UserRow = Selectable<UserTable>;

export interface TokenTable {
  token_id: GeneratedAlways<string>;
  created_at: GeneratedAlways<string>;
  user_id: string;
}

export interface ConversationTable {
  conversation_id: GeneratedAlways<string>;
  created_at: GeneratedAlways<string>;
  created_by: string;
  title: string | null;
}

export type ConversationRow = Selectable<ConversationTable>;
export type ConversationRowWithCreatedBy = WithCreatedBy<ConversationRow>;

export interface MessageTable {
  id: GeneratedAlways<string>;
  created_at: GeneratedAlways<string>;
  created_by: string;
  conversation_id: string;
  content: string;
}

export type MessageRow = Selectable<MessageTable>;
export type MessageRowWithCreatedBy = WithCreatedBy<MessageRow>;

export interface RecipientTable {
  id: GeneratedAlways<string>;
  created_at: GeneratedAlways<string>;
  conversation_id: string;
  user_id: string;
}

export type RecipientRow = Selectable<RecipientTable>;
export type RecipientRowWithUsername = RecipientRow & {
  username: string;
};
