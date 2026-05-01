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
import { Weekday } from './enums/weekdays';
import { AutobookingConfiguration, DailyTraining } from './interfaces/autobookingConfiguration';

(async () => {

    const log = new Logger(path.resolve(process.cwd(), 'logs'));

    log.info('Start process');

    let currentCronJob: ScheduledTask | null = null;

    const scheduleNextJob = (config: AutobookingConfiguration) => {

        if (currentCronJob) {
            currentCronJob.stop();
            log.info('Stopped previous cron job');
        }

        try {

            AutobookingConfigurationFactory.onChange((newConfig) => {
                scheduleNextJob(newConfig);
            });

        }
        catch (error) {

            log.error((error as Error).stack!);

        }

        if (!config.isActive || !config.trainings || Object.keys(config.trainings).length === 0) {
            log.info('Autobooking is inactive or no trainings configured.');
            return;
        }

        const currentDate = new Date();
        const bookingDate = new Date();
        bookingDate.setDate(currentDate.getDate() + (config.maxDaysInAdvance ?? 0));
        const training = getTrainingForDate(config, bookingDate);

        if (!training) {
            log.info(`No training configured for ${bookingDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()} ${bookingDate}`);
            return;
        }

        const [hour, minute] = training.classTimeRangeInit.split(':').map(Number);
        const cronExpression = `${minute} ${hour} ${currentDate.getDate()} ${currentDate.getMonth() + 1} ${currentDate.getDay()}`;

        currentCronJob = cron.schedule(cronExpression, async () => {
            await main(training, config.maxDaysInAdvance ?? 0, log);
            scheduleNextJob(config);
        });

        const formatter = new Intl.DateTimeFormat('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });

        log.info(`Scheduled next job for ${currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()} ${formatter.format(currentDate)} at ${training.classTimeRangeInit} to book the class for ${bookingDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()} ${formatter.format(bookingDate)} (${training.trainingName})`);

    };

    scheduleNextJob(await getAutobookingConfiguration(log));

    const dailyJobExpression = '0 0 * * *';
    // const dailyJobExpression = '0 */2 * * * *';
    cron.schedule(dailyJobExpression, async () => {

        scheduleNextJob(await getAutobookingConfiguration(log));

    });

})();

async function main(trainingOfTheDay: DailyTraining, maxDaysInAdvance: number, log: Logger) {

    log.info('start job execution...');

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
        log.info('end job execution');

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

function getTrainingForDate(config: AutobookingConfiguration, bookingDate: Date): DailyTraining | undefined {

    const dayOfWeek = bookingDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as Weekday;
    const training = config.trainings?.[dayOfWeek];

    if (!training) return undefined;

    const [hours, minutes] = training.classTimeRangeInit.split(':').map(Number);
    const referenceDate = new Date();
    referenceDate.setHours(hours, minutes, 0, 0);

    if (referenceDate <= new Date()) return undefined;

    return training;

}