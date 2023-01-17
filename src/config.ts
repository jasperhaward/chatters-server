const {
    POSTGRES_HOST,
    POSTGRES_PORT,
    POSTGRES_USER,
    POSTGRES_PASSWORD,
    POSTGRES_DATABASE,
    PORT,
} = process.env;

export interface Config {
    POSTGRES_HOST: string;
    POSTGRES_PORT: string;
    POSTGRES_USER: string;
    POSTGRES_PASSWORD: string;
    POSTGRES_DATABASE: string;
    PORT: string;
}

const config: Partial<Config> = {
    POSTGRES_HOST,
    POSTGRES_PORT,
    POSTGRES_USER,
    POSTGRES_PASSWORD,
    POSTGRES_DATABASE,
    PORT,
};

for (const key in config) {
    if (!config[key as keyof Config]) {
        throw new Error(`Environment variable '${key}' is required.`);
    }
}

export default config as Config;
