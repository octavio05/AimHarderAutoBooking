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
import { CouchDbAdapter } from './adapters/couchDbAdapter';
import { DatabaseAdapter } from './interfaces/databaseAdapter';
import { DatabaseConfig } from './interfaces/databaseConfig';
import { Repository } from './interfaces/repository';
import { AutobookingConfiguration, AutobookingConfigurationDto } from './interfaces/autobookingConfiguration';
import { ConfigurationRepository } from './repositories/configurationRepository';
import { Trainings } from './enums/trainings';

(async () => {

    // const cronExpresion = '30 15 * * *';

    // cron.schedule(cronExpresion, async () => {

    await main();

    // });

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
    const databaseConfig: DatabaseConfig = {
        user: config.DB_USER,
        password: config.DB_PASSWORD,
        host: config.DB_HOST,
        port: config.DB_PORT,
        dbName: config.DB_NAME
    };
    const database: DatabaseAdapter = new CouchDbAdapter(databaseConfig);
    const bookingConfigRepository: Repository<AutobookingConfigurationDto> = new ConfigurationRepository(database);
    const bookingConfig: AutobookingConfigurationDto | undefined = await bookingConfigRepository.get();

    const autobookingConfiguration: AutobookingConfiguration = {
        trainingName: bookingConfig?.configuration.trainingName ?? Trainings.UNDEFINED,
        classTimeRange: bookingConfig?.configuration.classTimeRangeInit + ' - ' + bookingConfig?.configuration.classTimeRangeEnd,
        maxDaysInAdvance: bookingConfig?.configuration.maxDaysInAdvance ?? 0,
        isActive: bookingConfig?.configuration.isActive ?? false
    };

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