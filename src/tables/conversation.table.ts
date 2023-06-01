import { GeneratedAlways, Insertable, Selectable, Updateable } from "kysely";

export interface ConversationTable {
  conversation_id: GeneratedAlways<string>;
}

export type ConversationRow = Selectable<ConversationTable>;
export type InsertableConversationRow = Insertable<ConversationTable>;
export type UpdateableConversationRow = Updateable<ConversationTable>;
