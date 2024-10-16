import { GeneratedAlways, Insertable, Selectable } from "kysely";

export interface UserAccountTable {
  user_id: GeneratedAlways<string>;
  username: string;
  created_at: GeneratedAlways<string>;
}

export type UserAccountRow = Selectable<UserAccountTable>;
export type InsertableUserAccountRow = Insertable<UserAccountTable>;

export interface UserTokenTable {
  token_id: GeneratedAlways<string>;
  user_id: string;
  created_at: GeneratedAlways<string>;
}

export type UserTokenRow = Selectable<UserTokenTable>;
export type InsertableUserTokenRow = Insertable<UserTokenTable>;

export interface UserPasswordTable {
  user_id: string;
  password_hash: string;
}

export type UserPasswordRow = Selectable<UserPasswordTable>;
export type InsertableUserPasswordRow = Insertable<UserPasswordTable>;

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
  id: GeneratedAlways<string>;
  created_at: GeneratedAlways<string>;
  created_by: GeneratedAlways<string>;
  conversation_id: GeneratedAlways<string>;
  content: GeneratedAlways<string>;
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
  user_account: UserAccountTable;
  user_password: UserPasswordTable;
  user_token: UserTokenTable;
  conversation: ConversationTable;
  conversation_recipient: RecipientTable;
  conversation_message: MessageTable;
  conversation_latest_message: LatestMessageView;
}
