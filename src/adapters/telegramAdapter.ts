import TelegramBot from 'node-telegram-bot-api';
import { Notifier } from '../interfaces/notifier';

export class TelegramAdapter implements Notifier {

    private readonly _chatId: string;
    private bot: TelegramBot;

    public constructor(token: string, chatId: string) {

        if (token === null || token === undefined || token.trim() === '')
            throw new Error('token cannot be null or empty');

        if (chatId === null || chatId === undefined || chatId.trim() === '')
            throw new Error('chatId cannot be null or empty');

        this._chatId = chatId;
        this.bot = new TelegramBot(token, {
            polling: false
        });

    }

    public sendMessage(message: string): void {

        this.bot.sendMessage(this._chatId, message);

    }

}