export type CreateConversationsErrorCode =
  | "MinimumRecipientsRequired"
  | "MaximumRecipientsExceeded"
  | "RecipientNotFound";

export type CreateConversationMessageErrorCode =
  | "MinimumLengthRequired"
  | "MaximumLengthExceeded"
  | "CreatedByNotConversationRecipient";

export type CreateConversatioRecipientErrorCode =
  | "RecipientAlreadyConversationMember"
  | "RecipientNotFound";
