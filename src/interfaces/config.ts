export interface Config {
    NODE_ENV: "development" | "production";
    EMAIL: string;
    PASSWORD: string;
    TELEGRAM_TOKEN: string;
    TELEGRAM_CHAT_ID: string;
    SIMULATION_MODE: boolean;
    SEND_TELEGRAM_NOTIFICATION: boolean;
}