import { GeneratedAlways, Insertable, Selectable, Updateable } from "kysely";

export interface MessageTable {
  id: GeneratedAlways<string>;
  created_at: GeneratedAlways<string>;
  conversation_id: string;
  content: string;
  created_by: string;
}

export type MessageRow = Selectable<MessageTable>;
export type InsertableMessageRow = Insertable<MessageTable>;
export type UpdateableMessageRow = Updateable<MessageTable>;
