import { randomBytes, pbkdf2Sync } from "crypto";

const MIN_PASSWORD_LENGTH = 10;
const MAX_PASSWORD_LENGTH = 256;

export class PasswordTooWeakError extends Error {}
export class PasswordTooLongError extends Error {}

export function encryptPassword(password: string) {
    if (password.length < MIN_PASSWORD_LENGTH) {
        throw new PasswordTooWeakError();
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
        throw new PasswordTooLongError();
    }

    const salt = randomBytes(64).toString("base64");
    const passwordHash = generatePasswordHash(password, salt);

    return `${salt}:${passwordHash}`;
}

function generatePasswordHash(password: string, salt: string) {
    const passwordHash = pbkdf2Sync(password, salt, 10000, 64, "sha512");

    return passwordHash.toString("hex");
}

export function verifyPassword(
    storedPassword: string,
    passwordAttempt: string
) {
    const [salt, passwordHash] = storedPassword.split(":");

    return passwordHash === generatePasswordHash(passwordAttempt, salt);
}
