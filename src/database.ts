import { UserTable } from "./controllers/auth.table";

export interface Database {
    user_account: UserTable;
}

/** See https://www.postgresql.org/docs/10/errcodes-appendix.html */
export enum DatabaseErrorCode {
    UniqueViolation = "23505",
}
