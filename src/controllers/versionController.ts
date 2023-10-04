import packageJson from "../../package.json";
import config from "../config";
import { FastifyTypebox } from "../types";
import { VersionSchema } from "./versionSchema";

export default async function versionController(fastify: FastifyTypebox) {
  fastify.get("/", { schema: VersionSchema }, () => {
    return {
      name: packageJson.name,
      version: packageJson.version,
      environment: config.environment,
    };
  });
}
