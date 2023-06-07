import "dotenv/config";
import { PoolConfig } from "pg";
import { parseEnv } from "./util";

export interface Config {
  readonly port: number;
  readonly authTokenSecret: string;
  readonly authTokenExpiryDuration: number;
  readonly minPasswordLength: number;
  readonly maxPasswordLength: number;
  readonly maxConversationRecipients: 10;
  readonly database: PoolConfig;
}

const config: Config = {
  port: parseEnv("PORT", "number", 3001),
  authTokenSecret: parseEnv("AUTH_TOKEN_SECRET", "string"),
  authTokenExpiryDuration: 3000,
  minPasswordLength: 10,
  maxPasswordLength: 256,
  maxConversationRecipients: 10,
  database: {
    host: parseEnv("POSTGRES_HOST", "string"),
    port: parseEnv("POSTGRES_PORT", "number"),
    user: parseEnv("POSTGRES_USER", "string"),
    password: parseEnv("POSTGRES_PASSWORD", "string"),
    database: parseEnv("POSTGRES_DATABASE", "string"),
  },
};

export default config;
