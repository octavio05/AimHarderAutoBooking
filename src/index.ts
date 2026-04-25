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
import cron, { ScheduledTask } from 'node-cron';
import { AutobookingConfigurationFactory } from './factories/autobookingConfigurationFactory';
import { AutobookingConfiguration } from './interfaces/autobookingConfiguration';

(async () => {

    let currentCronJob: ScheduledTask | null = null;
    const log = new Logger(path.resolve(process.cwd(), 'logs'));

    const scheduleJob = (config: AutobookingConfiguration) => {

        if (currentCronJob) {
            currentCronJob.stop();
            log.info('Stopped previous cron job');
        }

        const [hour, minutes] = config.classtimeRangeInit.split(':');
        if (!hour || !minutes) {

            log.info('classTimeRangeInit not defined.');
            return;

        }

        const cronExpression = `${minutes} ${hour} * * *`;

        currentCronJob = cron.schedule(cronExpression, async () => {
            if (config.isActive)
                await main(config);
        });

        log.info(`Scheduled new cron job for ${cronExpression} (Active: ${config.isActive})`);

    };

    const autobookingConfiguration = await AutobookingConfigurationFactory.create();
    scheduleJob(autobookingConfiguration);

    AutobookingConfigurationFactory.onChange((newConfig) => {
        scheduleJob(newConfig);
    });

})();

async function main(autobookingConfiguration: AutobookingConfiguration) {

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

        const platform: Platform = new AimHarderAdapter(browser, autobookingConfiguration, simulationMode);

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