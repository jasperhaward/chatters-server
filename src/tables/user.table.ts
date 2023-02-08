import { GeneratedAlways, Insertable, Selectable, Updateable } from "kysely";

export interface UserTable {
    id: GeneratedAlways<string>;
    username: string;
    password: string;
}

export type UserRow = Selectable<UserTable>;
export type InsertableUserRow = Insertable<UserTable>;
export type UpdateableUserRow = Updateable<UserTable>;
