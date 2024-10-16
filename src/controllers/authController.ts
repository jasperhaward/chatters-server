import { FastifyTypebox, ControllerOptions } from "../types";
import authentication from "../hooks/authenticationHook";

import { encryptPassword, verifyPassword, generateToken } from "../services";
import {
  insertUser,
  findUserByUsername,
  deleteTokenByTokenId,
  findUserPasswordHashByUserId,
  insertUserPassword,
  InsertUserPasswordParams,
} from "../stores";
import { BadRequestError, UnauthorisedError } from "../errors";
import { RegisterSchema, LoginSchema } from "./authSchema";

export default async function authController(
  fastify: FastifyTypebox,
  options: ControllerOptions
) {
  const { db } = options;

  fastify.post(
    "/register",
    { schema: RegisterSchema },
    async (request, reply) => {
      const { username, password, confirmPassword } = request.body;

      if (password !== confirmPassword) {
        throw new BadRequestError(
          "PasswordsNotMatching",
          "Password and confirm password must be the same."
        );
      }

      if (await findUserByUsername(db, username)) {
        throw new BadRequestError(
          "UsernameNotUnique",
          "Username is not unique."
        );
      }

      const user = await db.transaction().execute(async (trx) => {
        const user = await insertUser(trx, username);

        const passwordParams: InsertUserPasswordParams = {
          userId: user.id,
          passwordHash: encryptPassword(password),
        };

        await insertUserPassword(trx, passwordParams);

        return user;
      });

      reply.code(201);

      return user;
    }
  );

  fastify.post("/login", { schema: LoginSchema }, async (request) => {
    const { username, password } = request.body;

    const user = await findUserByUsername(db, username);

    if (!user) {
      throw new UnauthorisedError();
    }

    const passwordHash = await findUserPasswordHashByUserId(db, user.id);

    if (!verifyPassword(passwordHash, password)) {
      throw new UnauthorisedError();
    }

    const token = await generateToken(db, user.id);

    return { user, token };
  });

  fastify.post(
    "/logout",
    { onRequest: authentication(db) },
    async (request, reply) => {
      const { token } = request;

      await deleteTokenByTokenId(db, token.tokenId);

      reply.code(204);
    }
  );
}
