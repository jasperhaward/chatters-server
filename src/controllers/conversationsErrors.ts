export type CreateConversationErrorCode =
  | "MinimumRecipientsRequired"
  | "ExistingDirectConversation"
  | "RecipientNotFound";

export type GetConversationMessagesErrorCode =
  | "ConversationNotFound"
  | "UserNotConversationRecipient";

export type CreateConversationMessageErrorCode =
  | "ConversationNotFound"
  | "UserNotConversationRecipient";

export type CreateConversationRecipientErrorCode =
  | "ConversationNotFound"
  | "RecipientNotFound"
  | "UserNotConversationRecipient"
  | "RecipientAlreadyConversationMember";

export type DeleteConversationRecipientErrorCode =
  | "ConversationNotFound"
  | "UserNotConversationRecipient"
  | "MinimumRecipientsRequired"
  | "RecipientNotConversationMember"
  | "ExistingDirectConversation";
