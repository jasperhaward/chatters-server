import { GeneratedAlways, Insertable, Selectable } from "kysely";
import { ConversationEventType } from "./schema";

// User & auth tables

interface UserAccountTable {
  user_id: GeneratedAlways<string>;
  username: string;
  created_at: GeneratedAlways<string>;
}

export type UserAccountRow = Selectable<UserAccountTable>;

interface UserPasswordTable {
  user_id: string;
  password_hash: string;
}

export type UserPasswordRow = Selectable<UserPasswordTable>;
export type InsertableUserPasswordRow = Insertable<UserPasswordTable>;

interface UserTokenTable {
  token_id: GeneratedAlways<string>;
  user_id: string;
  created_at: GeneratedAlways<string>;
}

export type UserTokenRow = Selectable<UserTokenTable>;
export type InsertableUserTokenRow = Insertable<UserTokenTable>;

// Conversation event table & views

interface ConversationEventTable {
  id: GeneratedAlways<number>;
  conversation_id: string;
  event_type: ConversationEventType;
  created_at: GeneratedAlways<string>;
  created_by: string;
  title: string | null;
  recipient_id: string | null;
  message: string | null;
}

export type ConversationEventRow = Selectable<ConversationEventTable>;
export type InsertableConversationEventRow = Insertable<ConversationEventTable>;

/**
 * As our views are readonly we can make all fields in the interface `GeneratedAlways`.
 */
type View<T> = {
  [K in keyof T]: GeneratedAlways<T[K]>;
};

interface ConversationEventShared {
  id: number;
  conversation_id: string;
  created_at: string;
  created_by: string;
  created_by_username: string;
}

interface CreationEsView extends ConversationEventShared {
  event_type: ConversationEventType.ConversationCreated;
}

interface TitleEsView extends ConversationEventShared {
  event_type: ConversationEventType.ConversationTitleUpdated;
  title: string;
}

interface RecipientEsView extends ConversationEventShared {
  event_type: ConversationEventType.RecipientCreated;
  recipient_id: string;
  recipient_username: string;
}

interface LatestEventEsView extends ConversationEventShared {
  event_type: ConversationEventType;
  message: string | null;
  title: string | null;
  recipient_id: string | null;
  recipient_username: string | null;
}

export interface Database {
  user_account: UserAccountTable;
  user_password: UserPasswordTable;
  user_token: UserTokenTable;
  conversation_event: ConversationEventTable;
  conversation_creation_es: View<CreationEsView>;
  conversation_title_es: View<TitleEsView>;
  conversation_recipient_es: View<RecipientEsView>;
  conversation_latest_event_es: View<LatestEventEsView>;
}
