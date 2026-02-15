import { Logger } from './logger';
import * as path from 'path';
import { PlaywrightAdapter } from './adapters/playwright/playwrightAdapter';
import { config } from './config';
import { BrowserAdapter } from './interfaces/browserAdapter';
import { Platform } from './interfaces/platform';
import { AimHarderAdapter } from './adapters/aimHarderAdapter';
import { IBookingResult } from './interfaces/IBookingResult';
import { TelegramAdapter } from './adapters/telegramAdapter';
import { Notifier } from './interfaces/notifier';
import cron from 'node-cron';

(async () => {

    const cronExpresion = '44 08 * * *';

    cron.schedule(cronExpresion, async () => {

        await main();

    });

})();

async function main() {

    const log = new Logger(path.resolve(process.cwd(), 'logs'));

    log.info('start proccess');

    const email = config.EMAIL;
    const password = config.PASSWORD;
    const telegramToken = config.TELEGRAM_TOKEN;
    const telegramChatId = config.TELEGRAM_CHAT_ID;
    const simulationMode = config.SIMULATION_MODE;
    const sendTelegramNotification = config.SEND_TELEGRAM_NOTIFICATION;
    const browser: BrowserAdapter = new PlaywrightAdapter();

    try {

        const platform: Platform = new AimHarderAdapter(browser, simulationMode);

        await platform.login(email, password);
        const result: IBookingResult = await platform.doBooking();

        log.info(`- ${result.message}`);

        if (sendTelegramNotification) {

            const telegramNotifier: Notifier = new TelegramAdapter(telegramToken, telegramChatId);
            telegramNotifier.sendMessage(result.message);

        }

    }
    catch (error) {

        log.error((error as Error).stack!);

    }
    finally {

        await browser.close();
        log.info('end proccess');

    }

}