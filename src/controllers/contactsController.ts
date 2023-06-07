import { FastifyTypebox, ControllerOptions } from "../types";
import authentication from "../hooks/authentication";

import { findUsersExceptUserId } from "../stores";
import { GetContactsSchema } from "./contactsSchema";
import { toUserSchema } from "../util";

export default async function contacts(
  fastify: FastifyTypebox,
  options: ControllerOptions
) {
  const { db } = options;

  fastify.get(
    "/",
    {
      preHandler: authentication(db),
      schema: GetContactsSchema,
    },
    async (request) => {
      const { userId } = request.token;

      const users = await findUsersExceptUserId(db, userId);

      return users.map(toUserSchema);
    }
  );
}