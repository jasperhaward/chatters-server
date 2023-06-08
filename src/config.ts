import "dotenv/config";
import { PoolConfig } from "pg";
import { parseEnv } from "./utils";

export interface Config {
  port: number;
  database: PoolConfig;
  authTokenSecret: string;
  authTokenExpiryDuration: number;
  minUsernameLength: number;
  maxUsernameLength: number;
  minPasswordLength: number;
  maxPasswordLength: number;
  passwordSaltLength: number;
  passwordDerivationIterations: number;
  passwordDerivationKeyLength: number;
  maxConversationTitleLength: number;
  maxMessageLength: number;
}

const config: Readonly<Config> = {
  port: parseEnv("PORT", "number", 3001),
  database: {
    host: parseEnv("POSTGRES_HOST", "string"),
    port: parseEnv("POSTGRES_PORT", "number"),
    user: parseEnv("POSTGRES_USER", "string"),
    password: parseEnv("POSTGRES_PASSWORD", "string"),
    database: parseEnv("POSTGRES_DATABASE", "string"),
  },
  authTokenSecret: parseEnv("AUTH_TOKEN_SECRET", "string"),
  authTokenExpiryDuration: 3000,
  minUsernameLength: 5, // *
  maxUsernameLength: 25, // *
  minPasswordLength: 10, // *
  maxPasswordLength: 250, // *
  passwordSaltLength: 64,
  passwordDerivationIterations: 100000,
  passwordDerivationKeyLength: 64,
  maxConversationTitleLength: 20, // *
  maxMessageLength: 250, // *
};

// * - based on SQL './schema.sql'

export default config;
