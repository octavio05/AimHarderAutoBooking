export interface Config {
    NODE_ENV: "development" | "production";
    DB_HOST: string;
    DB_PORT: number;
    DB_USER: string;
    DB_PASSWORD: string;
    DB_NAME: string;
    EMAIL: string;
    PASSWORD: string;
    TELEGRAM_TOKEN: string;
    TELEGRAM_CHAT_ID: string;
    SIMULATION_MODE: boolean;
    SEND_TELEGRAM_NOTIFICATION: boolean;
    EXECUTE_JOB: boolean;
}