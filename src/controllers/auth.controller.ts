import { RegisterSchema, LoginSchema } from "./auth.schema";
import {
    insertUser,
    findUserByUsername,
    UsernameNotUniqueError,
} from "./auth.service";
import {
    encryptPassword,
    verifyPassword,
    PasswordTooLongError,
    PasswordTooWeakError,
} from "./password.service";
import { ControllerError } from "../util/errors";
import { FastifyTypebox, WithDb } from "../../types";

export default async function auth(fastify: FastifyTypebox, options: WithDb) {
    const { db } = options;

    fastify.post(
        "/register",
        { schema: RegisterSchema },
        async (request, reply) => {
            const { username, password, confirmPassword } = request.body;

            if (password !== confirmPassword) {
                throw new ControllerError(
                    400,
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
                    throw new ControllerError(
                        400,
                        "UsernameNotUnique",
                        "'username' must be unique"
                    );
                } else if (error instanceof PasswordTooWeakError) {
                    throw new ControllerError(
                        400,
                        "PasswordTooWeak",
                        "'password' is too short"
                    );
                } else if (error instanceof PasswordTooLongError) {
                    throw new ControllerError(
                        400,
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
            throw new ControllerError(
                401,
                "InvalidCredentials",
                "invalid credentials"
            );
        }

        return { user, token: "anystring" };
    });
}
