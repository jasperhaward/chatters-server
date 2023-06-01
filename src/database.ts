import { UserTable } from "./tables/userAccount.table";
import { TokenTable } from "./tables/userToken.table";
import { ConversationTable } from "./tables/conversation.table";
import { ConversationRecipientTable } from "./tables/conversationRecipient.table";
import { ConversationMessageTable } from "./tables/conversationMessage.table";

export interface Database {
  user_account: UserTable;
  user_token: TokenTable;
  conversation: ConversationTable;
  conversation_recipient: ConversationRecipientTable;
  conversation_message: ConversationMessageTable;
}

/** See https://www.postgresql.org/docs/10/errcodes-appendix.html */
export enum DatabaseErrorCode {
  UniqueViolation = "23505",
}
