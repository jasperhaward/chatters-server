export type CreateConversationErrorCode =
  | "MinimumRecipientsRequired"
  | "MaximumRecipientsExceeded"
  | "RecipientNotFound";

export type CreateConversationMessageErrorCode =
  | "MinimumLengthRequired"
  | "MaximumLengthExceeded"
  | "CreatedByNotConversationRecipient";

export type CreateConversationRecipientErrorCode =
  | "RecipientAlreadyConversationMember"
  | "RecipientNotFound";

export type DeleteConversationRecipientErrorCode =
  | "RecipientNotConversationMember";
