import { GeneratedAlways, Insertable, Selectable, Updateable } from "kysely";

export interface RecipientTable {
  id: GeneratedAlways<string>;
  conversation_id: string;
  user_id: string;
}

export type RecipientRow = Selectable<RecipientTable>;
export type InsertableRecipientRow = Insertable<RecipientTable>;
export type UpdateableRecipientRow = Updateable<RecipientTable>;
