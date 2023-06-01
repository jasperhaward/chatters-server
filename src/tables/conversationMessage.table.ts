import { GeneratedAlways, Insertable, Selectable, Updateable } from "kysely";

export interface ConversationMessageTable {
  id: GeneratedAlways<string>;
  created_at: GeneratedAlways<string>;
  conversation_id: string;
  content: string;
  created_by: string;
}

export type ConversationMessageRow = Selectable<ConversationMessageTable>;
export type InsertableConversationMessageRow =
  Insertable<ConversationMessageTable>;
export type UpdateableConversationMessageRow =
  Updateable<ConversationMessageTable>;
