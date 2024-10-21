import { SwaggerOptions } from "@fastify/swagger";
import { PoolConfig } from "pg";
import packageJson from "../package.json";
import { parseEnv } from "./utils";

const environment = parseEnv("ENVIRONMENT");

const swaggerConfig: SwaggerOptions = {
  openapi: {
    info: {
      title: `Chatters API - ${environment}`,
      version: packageJson.version,
    },
    components: {
      securitySchemes: {
        token: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ token: [] }],
  },
};

export interface Config {
  name: string;
  version: string;
  environment: string;
  port: number;
  host: string;
  origins: RegExp[];
  swagger: SwaggerOptions;
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
  name: packageJson.name,
  version: packageJson.version,
  environment,
  host: parseEnv("HOST"),
  port: parseInt(parseEnv("PORT")),
  origins: [
    /^http:\/\/localhost:[0-9]{4}$/,
    /^http:\/\/server(.local)?:[0-9]{4}$/,
    /^https:\/\/(dev-)?chatters.jasperh.uk$/,
  ],
  swagger: swaggerConfig,
  database: {
    host: parseEnv("POSTGRES_HOST"),
    port: parseInt(parseEnv("POSTGRES_PORT")),
    user: parseEnv("POSTGRES_USER"),
    password: parseEnv("POSTGRES_PASSWORD"),
    database: parseEnv("POSTGRES_DATABASE"),
  },
  authTokenSecret: parseEnv("AUTH_TOKEN_SECRET"),
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

// * based on SQL schema

export default config;
