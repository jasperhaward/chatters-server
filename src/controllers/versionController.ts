import config from "../config";
import { FastifyTypebox } from "../types";
import { VersionSchema } from "./versionSchema";

export default async function versionController(fastify: FastifyTypebox) {
  fastify.get("/", { schema: VersionSchema }, () => {
    return {
      name: config.name,
      version: config.version,
      environment: config.environment,
    };
  });
}
