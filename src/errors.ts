type ErrorStatusCode = 400 | 401 | 404 | 500;

type ErrorCode =
  | "UsernameNotUnique"
  | "PasswordsNotMatching"
  | "MinimumRecipientsRequired"
  | "CannotSetDirectConversationTitle"
  | "ExistingDirectConversation"
  | "CannotCreateDirectConversation"
  | "UserNotFound"
  | "RecipientNotFound"
  | "ConversationNotFound"
  | "UserNotConversationRecipient"
  | "UserIsConversationRecipient"
  | "InvalidCredentials"
  | "InternalServerError";

export class ControllerError extends Error {
  readonly status: ErrorStatusCode;
  readonly code: ErrorCode;

  constructor(status: ErrorStatusCode, code: ErrorCode, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }

  toJSON() {
    return {
      error: { code: this.code, message: this.message },
    };
  }
}

export class BadRequestError extends ControllerError {
  constructor(code: ErrorCode, message: string) {
    super(400, code, message);
  }
}

export class UnauthorisedError extends ControllerError {
  constructor() {
    super(401, "InvalidCredentials", "Credentials are invalid.");
  }
}

export class InternalServerError extends ControllerError {
  constructor() {
    super(500, "InternalServerError", "Unknown error encountered.");
  }
}
