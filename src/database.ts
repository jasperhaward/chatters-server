import { UserTable } from "./tables/user.table";
import { TokenTable } from "./tables/token.table";

export interface Database {
    user_account: UserTable;
    user_token: TokenTable;
}

/** See https://www.postgresql.org/docs/10/errcodes-appendix.html */
export enum DatabaseErrorCode {
    UniqueViolation = "23505",
}
