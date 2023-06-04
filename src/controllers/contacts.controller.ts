import { FastifyTypebox, WithDb } from "../types";
import authentication from "../hooks/authentication.hook";

import { findUsers } from "../stores";
import { GetContactsSchema } from "./contacts.shema";
import { toUserSchmema } from "../util";

export default async function contacts(
  fastify: FastifyTypebox,
  options: WithDb
) {
  const { db } = options;

  fastify.get(
    "/",
    {
      preHandler: authentication(db),
      schema: GetContactsSchema,
    },
    async () => {
      const users = await findUsers(db);

      return users.map(toUserSchmema);
    }
  );
}
