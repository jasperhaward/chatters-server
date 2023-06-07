import {
  UserTable,
  TokenTable,
  ConversationTable,
  RecipientTable,
  MessageTable,
} from "./tables";

export interface Database {
  user_account: UserTable;
  user_token: TokenTable;
  conversation: ConversationTable;
  conversation_recipient: RecipientTable;
  conversation_message: MessageTable;
}

/** See https://www.postgresql.org/docs/10/errcodes-appendix.html */
export enum DatabaseErrorCode {
  InvalidUUID = "22P02",
  ForeignKeyViolation = "23503",
  UniqueViolation = "23505",
}
