import { GeneratedAlways, Insertable, Selectable, Updateable } from "kysely";

export interface ConversationRecipientTable {
  id: GeneratedAlways<string>;
  conversation_id: string;
  user_id: string;
}

export type ConversationRecipientRow = Selectable<ConversationRecipientTable>;
export type InsertableConversationRecipientRow =
  Insertable<ConversationRecipientTable>;
export type UpdateableConversationRecipientRow =
  Updateable<ConversationRecipientTable>;
