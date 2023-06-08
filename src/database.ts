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
