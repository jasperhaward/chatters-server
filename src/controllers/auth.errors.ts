export type RegisterErrorCode =
    | "UsernameNotUnique"
    | "PasswordsNotMatching"
    | "PasswordTooWeak"
    | "PasswordTooLong";

export type LoginErrorCode = "InvalidCredentials";
