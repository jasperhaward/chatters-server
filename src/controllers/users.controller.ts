import { FastifyTypebox, WithDb } from "../../types";
import authentication from "../hooks/authentication.hook";
import { findUserById } from "../stores/user.store";
import { GetUserSchema } from "./users.schema";

export default async function users(fastify: FastifyTypebox, options: WithDb) {
    const { db } = options;

    fastify.get(
        "/:userId",
        {
            preHandler: authentication(db),
            schema: GetUserSchema,
        },
        async (request) => {
            const { userId } = request.params;

            return await findUserById(db, userId);
        }
    );
}
