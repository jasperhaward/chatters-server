import { FastifyTypebox, ControllerOptions } from "../types";
import authentication from "../hooks/authenticationHook";

import { findUsers } from "../stores";
import { GetContactsSchema } from "./contactsSchema";

export default async function contactsController(
  fastify: FastifyTypebox,
  options: ControllerOptions
) {
  const { db } = options;

  fastify.get(
    "/",
    {
      schema: GetContactsSchema,
      onRequest: authentication(db),
    },
    async (request) => {
      const { userId } = request.token;

      const users = await findUsers(db);

      return users.filter((user) => user.id !== userId);
    }
  );
}
