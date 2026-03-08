import { CouchDbAdapter } from '../adapters/couchDbAdapter';
import { config } from '../config';
import { Trainings } from '../enums/trainings';
import { AutobookingConfiguration, AutobookingConfigurationDto } from '../interfaces/autobookingConfiguration';
import { DatabaseAdapter } from '../interfaces/databaseAdapter';
import { DatabaseConfig } from '../interfaces/databaseConfig';
import { Repository } from '../interfaces/repository';
import { ConfigurationRepository } from '../repositories/configurationRepository';

export class AutobookingConfigurationFactory {

    private static mapToConfiguration(dto: AutobookingConfigurationDto | undefined): AutobookingConfiguration {
        return {
            trainingName: dto?.configuration.trainingName ?? Trainings.UNDEFINED,
            classTimeRange: dto?.configuration.classTimeRangeInit + ' - ' + dto?.configuration.classTimeRangeEnd,
            classtimeRangeInit: dto?.configuration.classTimeRangeInit ?? '',
            classtimeRangeEnd: dto?.configuration.classTimeRangeEnd ?? '',
            maxDaysInAdvance: dto?.configuration.maxDaysInAdvance ?? 0,
            isActive: dto?.configuration.isActive ?? false
        };
    }

    private static getRepository(): Repository<AutobookingConfigurationDto> {
        const databaseConfig: DatabaseConfig = {
            user: config.DB_USER,
            password: config.DB_PASSWORD,
            host: config.DB_HOST,
            port: config.DB_PORT,
            dbName: config.DB_NAME
        };
        const database: DatabaseAdapter = new CouchDbAdapter(databaseConfig);
        return new ConfigurationRepository(database);
    }

    public static async create(): Promise<AutobookingConfiguration> {

        const bookingConfigRepository = this.getRepository();
        const bookingConfig: AutobookingConfigurationDto | undefined = await bookingConfigRepository.get();

        return this.mapToConfiguration(bookingConfig);

    }

    public static onChange(callback: (config: AutobookingConfiguration) => void): void {

        const bookingConfigRepository = this.getRepository();

        bookingConfigRepository.onChange(async () => {
            const bookingConfig: AutobookingConfigurationDto | undefined = await bookingConfigRepository.get();
            const configuration = this.mapToConfiguration(bookingConfig);
            callback(configuration);
        });

    }

}
