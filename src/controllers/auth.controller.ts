import { FastifyTypebox, WithDb } from "../../types";
import authentication from "../hooks/authentication.hook";
import {
    encryptPassword,
    verifyPassword,
    PasswordTooLongError,
    PasswordTooWeakError,
} from "../services/password.service";
import { generateToken } from "../services/token.service";
import {
    insertUser,
    findUserByUsername,
    UsernameNotUniqueError,
} from "../stores/user.store";
import { deleteToken } from "../stores/token.store";
import { BadRequest, Unauthorised } from "../util/errors";

import {
    RegisterSchema,
    LoginSchema,
    LogoutSchema,
    VerifyUserSchema,
} from "./auth.schema";

export default async function auth(fastify: FastifyTypebox, options: WithDb) {
    const { db } = options;

    fastify.post(
        "/register",
        { schema: RegisterSchema },
        async (request, reply) => {
            const { username, password, confirmPassword } = request.body;

            if (password !== confirmPassword) {
                throw new BadRequest(
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

                return user;
            } catch (error) {
                if (error instanceof UsernameNotUniqueError) {
                    throw new BadRequest(
                        "UsernameNotUnique",
                        "'username' must be unique"
                    );
                } else if (error instanceof PasswordTooWeakError) {
                    throw new BadRequest(
                        "PasswordTooWeak",
                        "'password' is too short"
                    );
                } else if (error instanceof PasswordTooLongError) {
                    throw new BadRequest(
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
            throw new Unauthorised();
        }

        const token = await generateToken(db, user.id);

        return { user, token };
    });

    fastify.post(
        "/logout/:userId",
        {
            preHandler: authentication(db),
            schema: LogoutSchema,
        },
        async (request, reply) => {
            const { token } = request;

            if (request.params.userId !== token.userId) {
                throw new Unauthorised();
            }

            await deleteToken(db, token.tokenId);

            reply.code(204).send();
        }
    );

    fastify.post(
        "/verify/:userId",
        {
            preHandler: authentication(db),
            schema: VerifyUserSchema,
        },
        async (request, reply) => {
            const { token } = request;

            if (request.params.userId !== token.userId) {
                throw new Unauthorised();
            }

            reply.code(204).send();
        }
    );
}
