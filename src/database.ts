import {
  UserTable,
  TokenTable,
  ConversationTable,
  MessageTable,
  RecipientTable,
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
  UniqueViolation = "23505",
}
