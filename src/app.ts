import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import config from "./config";
import accountsRouter from "./routes/accounts";
import authRouter from "./routes/auth";

const fastify = Fastify({
    logger: true,
});

await fastify.register(cors);

fastify.register(accountsRouter, { prefix: "/api/v1/accounts" });
fastify.register(authRouter, { prefix: "/api/v1/auth" });

await fastify.listen({
    port: Number(config.PORT),
});
