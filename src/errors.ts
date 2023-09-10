import { RegisterErrorCode } from "./controllers/authErrors";
import {
  CreateConversationErrorCode,
  GetConversationMessagesErrorCode,
  CreateConversationMessageErrorCode,
  CreateConversationRecipientErrorCode,
  DeleteConversationRecipientErrorCode,
} from "./controllers/conversationsErrors";

type ErrorStatusCode = 400 | 401 | 404 | 500;

type ErrorCode =
  | RegisterErrorCode
  | CreateConversationErrorCode
  | GetConversationMessagesErrorCode
  | CreateConversationMessageErrorCode
  | CreateConversationRecipientErrorCode
  | DeleteConversationRecipientErrorCode
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

export class InternalServerError extends ControllerError {
  constructor() {
    super(400, "InternalServerError", "Unknown internal server error.");
  }
}

export class UnauthorisedError extends ControllerError {
  constructor() {
    super(401, "InvalidCredentials", "Credentials are invalid.");
  }
}
