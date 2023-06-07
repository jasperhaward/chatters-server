import { RegisterErrorCode } from "../controllers/authErrors";
import {
  CreateConversationErrorCode,
  CreateConversationMessageErrorCode,
  CreateConversationRecipientErrorCode,
  DeleteConversationRecipientErrorCode,
} from "../controllers/conversationsErrors";

type ErrorStatusCode = 400 | 401 | 404 | 500;

type UnauthorisedErrorCode = "InvalidCredentials";

type ErrorCode =
  | RegisterErrorCode
  | CreateConversationErrorCode
  | CreateConversationMessageErrorCode
  | CreateConversationRecipientErrorCode
  | DeleteConversationRecipientErrorCode
  | UnauthorisedErrorCode;

class ControllerError extends Error {
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
