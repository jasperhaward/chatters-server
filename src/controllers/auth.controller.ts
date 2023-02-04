import { RegisterSchema, LoginSchema } from "./auth.schema";
import {
    insertUser,
    findUserByUsername,
    UsernameNotUniqueError,
} from "./user.store";
import {
    encryptPassword,
    verifyPassword,
    PasswordTooLongError,
    PasswordTooWeakError,
} from "./password.service";
import { generateToken, verifyToken } from "./token.service";
import { BadRequest, Unauthorised } from "../util/errors";
import { FastifyTypebox, WithDb } from "../../types";

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

    fastify.post("/verify", async (request) => {
        const { token } = request.body as { token: string };

        return await verifyToken(db, token);
    });
}
