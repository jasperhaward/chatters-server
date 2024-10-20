import { GeneratedAlways, Insertable, Selectable } from "kysely";
import { ConversationEventType } from "./schema";

// Shared tables

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

// Event sourcing tables

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

interface EsViewShared {
  id: GeneratedAlways<number>;
  conversation_id: GeneratedAlways<string>;
  created_at: GeneratedAlways<string>;
  created_by: GeneratedAlways<string>;
  created_by_username: GeneratedAlways<string>;
}

interface CreationEsView extends EsViewShared {
  event_type: ConversationEventType.ConversationCreated;
}

export type CreationEsRow = Selectable<CreationEsView>;

interface TitleEsView extends EsViewShared {
  event_type: ConversationEventType.ConversationTitleUpdated;
  title: GeneratedAlways<string>;
}

export type TitleEsRow = Selectable<TitleEsView>;

interface RecipientEsView extends EsViewShared {
  event_type: ConversationEventType.RecipientCreated;
  recipient_id: GeneratedAlways<string>;
  recipient_username: GeneratedAlways<string>;
}

export type RecipientEsRow = Selectable<RecipientEsView>;

interface LatestMessageEsView extends EsViewShared {
  event_type: ConversationEventType.MessageCreated;
  message: GeneratedAlways<string>;
}

export type LatestMessageEsRow = Selectable<LatestMessageEsView>;

export interface Database {
  // Shared tables
  user_account: UserAccountTable;
  user_password: UserPasswordTable;
  user_token: UserTokenTable;
  // Event sourcing tables
  conversation_event: ConversationEventTable;
  conversation_creation_es: CreationEsView;
  conversation_title_es: TitleEsView;
  conversation_recipient_es: RecipientEsView;
  conversation_latest_message_es: LatestMessageEsView;
}
