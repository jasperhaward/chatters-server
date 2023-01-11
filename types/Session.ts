import { User } from ".";

export interface Session {
    user: User;
    token: string;
}
