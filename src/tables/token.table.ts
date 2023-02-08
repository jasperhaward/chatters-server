import { GeneratedAlways, Insertable, Selectable, Updateable } from "kysely";

export interface TokenTable {
    id: GeneratedAlways<string>;
    user_id: string;
}

export type TokenRow = Selectable<TokenTable>;
export type InsertableTokenRow = Insertable<TokenTable>;
export type UpdateableTokenRow = Updateable<TokenTable>;
