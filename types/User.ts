export interface User {
    id: string;
    username: string;
}

export interface UserWithPassword extends User {
    password: string;
}
