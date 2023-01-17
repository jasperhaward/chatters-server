import { Pool } from "pg";

export interface TAccount {
    id: string;
    username: string;
    password: string;
}

export default class Account {
    pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async create({ username, password }: Omit<TAccount, "id">) {
        const query = `
            INSERT INTO account (username, password) 
                VALUES ($1, $2) 
                RETURNING *;
        `;
        const values = [username, password];

        const result = await this.pool.query<TAccount>(query, values);

        return result.rows[0];
    }

    async get(): Promise<TAccount | null>;
    async get(id: string): Promise<TAccount[] | null>;
    async get(id?: string) {
        let query, values;

        if (id) {
            query = `SELECT * FROM account WHERE id=$1;`;
            values = [id];
        } else {
            query = `SELECT * FROM account;`;
        }

        const result = await this.pool.query<TAccount>(query, values);

        if (result.rowCount === 0) {
            return null;
        }

        return id ? result.rows[0] : result.rows;
    }

    async update(params: Partial<Omit<TAccount, "id">>) {
        const query = `SELECT * FROM account WHERE id=$1;`;
        const values = [params];

        const result = await this.pool.query<TAccount>(query, values);

        if (result.rowCount === 0) {
            return null;
        }

        return result.rows[0];
    }
}
