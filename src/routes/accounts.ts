import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import db from "../db";

export default async function accounts(fastify: FastifyInstance) {
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
                response: {
                    201: {
                        type: "object",
                        required: ["id", "username"],
                        properties: {
                            id: { type: "string" },
                            username: { type: "string" },
                        },
                    },
                },
            },
        },
        async (
            request: FastifyRequest<{
                Body: {
                    username: string;
                    password: string;
                };
            }>,
            reply: FastifyReply
        ) => {
            reply.code(201);

            return await db.accounts.create(request.body);
        }
    );

    fastify.patch(
        "/:id",
        {
            schema: {
                body: {
                    type: "object",
                    properties: {
                        username: { type: "string" },
                        password: { type: "string" },
                    },
                    oneOf: [
                        { required: ["username"] },
                        { required: ["password"] },
                    ],
                },
                // response: {
                //     200: {
                //         type: "object",
                //         required: ["id", "username"],
                //         properties: {
                //             id: { type: "string" },
                //             username: { type: "string" },
                //         },
                //     },
                // },
            },
        },
        async (
            request: FastifyRequest<{
                Params: {
                    id: string;
                };
                Body: {
                    username: string;
                    password: string;
                };
            }>,
            reply: FastifyReply
        ) => {
            const account = await db.accounts.get(request.params.id);

            if (!account) {
                return reply.code(404);
            }

            return account;
        }
    );
}
