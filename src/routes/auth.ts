import { FastifyInstance, FastifyRequest } from "fastify";
import db from "../db";
import { UserWithPassword } from "types";

export default async function auth(fastify: FastifyInstance) {
    fastify.get("/users", async () => {
        return await db.accounts.get();
    });

    fastify.post(
        "/register",
        {
            schema: {
                body: {
                    type: "object",
                    required: ["username", "password"],
                    properties: {
                        username: { type: "string" },
                        password: { type: "string" },
                    },
                },
            },
        },
        async (
            request: FastifyRequest<{
                Body: { username: string; password: string };
            }>
        ) => {
            return await db.accounts.create(request.body);
        }
    );

    //fastify.post("/login", async () => {});

    //fastify.post("/logout", async () => {});
}
