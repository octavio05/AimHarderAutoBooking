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
import { AutobookingConfigurationFactory } from './factories/autobookingConfigurationFactory';
import { AutobookingConfiguration, DailyTraining } from './interfaces/autobookingConfiguration';
import { BookingJobManager } from './managers/bookingJobManager';
import { IBookingJobManager } from './interfaces/IBookingJobManager';

(async () => {

    const log = new Logger(path.resolve(process.cwd(), 'logs'));

    log.info('Start process');
    const executeJob = config.EXECUTE_JOB;
    log.info(`EXECUTE JOB: ${executeJob}`);

    const bookingJobManager: IBookingJobManager = getBookingJobManager(log);

    if (executeJob) {

        bookingJobManager.start(await getAutobookingConfiguration(log));

        const dailyJobExpression = '0 0 * * *';
        cron.schedule(dailyJobExpression, async () => {

            bookingJobManager.start(await getAutobookingConfiguration(log));

        });

    }
    else
        await bookingJobManager.startNow(await getAutobookingConfiguration(log));

})();

async function main(trainingOfTheDay: DailyTraining, maxDaysInAdvance: number, log: Logger) {

    log.info('start booking process execution...');

    const email = config.EMAIL;
    const password = config.PASSWORD;
    const telegramToken = config.TELEGRAM_TOKEN;
    const telegramChatId = config.TELEGRAM_CHAT_ID;
    const simulationMode = config.SIMULATION_MODE;
    const sendTelegramNotification = config.SEND_TELEGRAM_NOTIFICATION;
    const browser: BrowserAdapter = new PlaywrightAdapter();

    try {

        const platform: Platform = new AimHarderAdapter(browser, trainingOfTheDay, maxDaysInAdvance, simulationMode);

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
        log.info('end booking process execution');

    }

}

async function getAutobookingConfiguration(log: Logger): Promise<AutobookingConfiguration> {

    try {

        return await AutobookingConfigurationFactory.create();

    }
    catch (error) {

        log.error((error as Error).stack!);
        return {} as AutobookingConfiguration;

    }

}

function getBookingJobManager(log: Logger): IBookingJobManager {

    const bookingJobManager: IBookingJobManager = new BookingJobManager(log, async (training, maxDaysInAdvance, log) => {

        await main(training, maxDaysInAdvance, log);
        bookingJobManager.stop();
        bookingJobManager.start(await getAutobookingConfiguration(log));

    });

    return bookingJobManager;

}

