import { GeneratedAlways, Insertable, Selectable } from "kysely";

export interface UserTable {
  user_id: GeneratedAlways<string>;
  created_at: GeneratedAlways<string>;
  username: string;
  password: string;
}

export type UserRow = Selectable<UserTable>;
export type InsertableUserRow = Insertable<UserTable>;

export interface TokenTable {
  token_id: GeneratedAlways<string>;
  created_at: GeneratedAlways<string>;
  user_id: string;
}

export type TokenRow = Selectable<TokenTable>;
export type InsertableTokenRow = Insertable<TokenTable>;

export interface ConversationTable {
  conversation_id: GeneratedAlways<string>;
  created_at: GeneratedAlways<string>;
  created_by: string;
  title: string | null;
}

export type ConversationRow = Selectable<ConversationTable>;
export type InsertableConversationRow = Insertable<ConversationTable>;

export interface MessageTable {
  id: GeneratedAlways<string>;
  created_at: GeneratedAlways<string>;
  created_by: string;
  conversation_id: string;
  content: string;
}

export type MessageRow = Selectable<MessageTable>;
export type InsertableMessageRow = Insertable<MessageTable>;

export interface LatestMessageView {
  conversation_id: GeneratedAlways<string>;
  latest_message_id: GeneratedAlways<string>;
  latest_message_created_at: GeneratedAlways<string>;
  latest_message_created_by: GeneratedAlways<string>;
  latest_message_content: GeneratedAlways<string>;
}

export type LatestMessageRow = Selectable<MessageTable>;

export interface RecipientTable {
  id: GeneratedAlways<string>;
  created_at: GeneratedAlways<string>;
  conversation_id: string;
  user_id: string;
}

export type RecipientRow = Selectable<RecipientTable>;
export type InsertableRecipientRow = Insertable<RecipientTable>;

export interface Database {
  user_account: UserTable;
  user_token: TokenTable;
  conversation: ConversationTable;
  conversation_recipient: RecipientTable;
  conversation_message: MessageTable;
  conversation_latest_message: LatestMessageView;
}
