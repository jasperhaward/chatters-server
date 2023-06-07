import { FastifyTypebox, ControllerOptions } from "../types";
import authentication from "../hooks/authentication";

import {
  encryptPassword,
  verifyPassword,
  PasswordTooLongError,
  PasswordTooWeakError,
  generateToken,
} from "../services";
import {
  insertUser,
  findUserByUsername,
  UsernameNotUniqueError,
  deleteTokenByTokenId,
} from "../stores";
import { BadRequestError, UnauthorisedError, toUserSchema } from "../util";
import { RegisterSchema, LoginSchema } from "./authSchema";

export default async function auth(
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
          "'password' and 'confirmPassword' must be the same"
        );
      }

      try {
        const hashedPassword = encryptPassword(password);

        const user = await insertUser(db, {
          username,
          password: hashedPassword,
        });

        reply.code(201);

        return toUserSchema(user);
      } catch (error) {
        if (error instanceof UsernameNotUniqueError) {
          throw new BadRequestError(
            "UsernameNotUnique",
            "'username' must be unique"
          );
        } else if (error instanceof PasswordTooWeakError) {
          throw new BadRequestError(
            "PasswordTooWeak",
            "'password' is too short"
          );
        } else if (error instanceof PasswordTooLongError) {
          throw new BadRequestError(
            "PasswordTooLong",
            "'password' is too long"
          );
        }

        throw error;
      }
    }
  );

  fastify.post("/login", { schema: LoginSchema }, async (request) => {
    const { username, password } = request.body;

    const user = await findUserByUsername(db, username);

    if (!user || !verifyPassword(user.password, password)) {
      throw new UnauthorisedError();
    }

    const token = await generateToken(db, user.user_id);

    return {
      user: toUserSchema(user),
      token,
    };
  });

  fastify.post(
    "/logout",
    { preHandler: authentication(db) },
    async (request, reply) => {
      const { token } = request;

      await deleteTokenByTokenId(db, token.tokenId);

      return reply.code(204);
    }
  );
}
