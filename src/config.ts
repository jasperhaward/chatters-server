import "dotenv/config";
import { PoolConfig } from "pg";
import { parseEnv } from "./util";

export interface Config {
  readonly port: number;
  readonly authTokenSecret: string;
  readonly authTokenExpiryDuration: number;
  readonly database: PoolConfig;
}

const config: Config = {
  port: parseEnv("PORT", "number"),
  authTokenSecret: parseEnv("AUTH_TOKEN_SECRET", "string"),
  authTokenExpiryDuration: parseEnv("AUTH_TOKEN_EXIRY_DURATION", "number"),
  database: {
    host: parseEnv("POSTGRES_HOST", "string"),
    port: parseEnv("POSTGRES_PORT", "number"),
    user: parseEnv("POSTGRES_USER", "string"),
    password: parseEnv("POSTGRES_PASSWORD", "string"),
    database: parseEnv("POSTGRES_DATABASE", "string"),
  },
};

export default config;
