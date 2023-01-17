import pg from "pg";
import config from "../config";
import Account from "./models/Account";

const pool = new pg.Pool({
    host: config.POSTGRES_HOST,
    port: Number(config.POSTGRES_PORT),
    user: config.POSTGRES_USER,
    password: config.POSTGRES_PASSWORD,
    database: config.POSTGRES_DATABASE,
});

const models = {
    accounts: new Account(pool),
};

export default models;
