import { RegisterErrorCode } from "../controllers/auth.errors";

type ErrorStatusCode = 400 | 401 | 404 | 500;

type ErrorCode = BadRequestErrorCode | UnauthorisedErrorCode;

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

export type BadRequestErrorCode = RegisterErrorCode;

export class BadRequest extends ControllerError {
    constructor(code: BadRequestErrorCode, message: string) {
        super(400, code, message);
    }
}

export type UnauthorisedErrorCode = "InvalidCredentials";

export class Unauthorised extends ControllerError {
    constructor() {
        super(401, "InvalidCredentials", "Credentials are invalid.");
    }
}
