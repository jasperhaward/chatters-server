export type CreateConversationErrorCode =
  | "MinimumRecipientsRequired"
  | "RecipientNotFound";

export type CreateConversationMessageErrorCode =
  | "ConversationNotFound"
  | "UserNotConversationRecipient";

export type CreateConversationRecipientErrorCode =
  | "ConversationNotFound"
  | "RecipientNotFound"
  | "RecipientAlreadyConversationMember";

export type DeleteConversationRecipientErrorCode =
  | "ConversationNotFound"
  | "MinimumRecipientsRequired"
  | "RecipientNotConversationMember";
