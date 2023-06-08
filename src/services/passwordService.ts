import { randomBytes, pbkdf2Sync } from "crypto";
import config from "../config";

export function encryptPassword(password: string) {
  const salt = randomBytes(config.passwordSaltLength).toString("base64");
  const passwordHash = generatePasswordHash(password, salt);

  return `${salt}:${passwordHash}`;
}

function generatePasswordHash(password: string, salt: string) {
  const passwordHash = pbkdf2Sync(
    password,
    salt,
    config.passwordDerivationIterations,
    config.passwordDerivationKeyLength,
    "sha512"
  );

  return passwordHash.toString("hex");
}

export function verifyPassword(
  storedPassword: string,
  passwordAttempt: string
) {
  const [salt, passwordHash] = storedPassword.split(":");

  return passwordHash === generatePasswordHash(passwordAttempt, salt);
}
