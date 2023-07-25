import packageJson from "../../package.json";
import config from "../config";
import { FastifyTypebox } from "../types";
import { IndexSchema } from "./indexSchema";

export default async function indexController(fastify: FastifyTypebox) {
  fastify.get("/", { schema: IndexSchema }, () => {
    return {
      name: packageJson.name,
      version: packageJson.version,
      environment: config.environment,
    };
  });
}
