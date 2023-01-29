import { RegisterErrorCode, LoginErrorCode } from "../controllers/auth.errors";

export type ErrorStatusCode = 400 | 401 | 404 | 500;

export type ErrorCode = RegisterErrorCode | LoginErrorCode;

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
