import { FastifyTypebox, ControllerOptions } from "../types";
import authentication from "../hooks/authenticationHook";

import { encryptPassword, verifyPassword, generateToken } from "../services";
import {
  InsertUserParams,
  insertUser,
  findUserByUsername,
  deleteTokenByTokenId,
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

      reply.code(201);

      const params: InsertUserParams = {
        username,
        hashedPassword: encryptPassword(password),
      };

      return await insertUser(db, params);
    }
  );

  fastify.post("/login", { schema: LoginSchema }, async (request) => {
    const { username, password } = request.body;

    const user = await findUserByUsername(db, username);

    if (!user || !verifyPassword(user.password, password)) {
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
