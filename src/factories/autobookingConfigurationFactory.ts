import { CouchDbAdapter } from '../adapters/couchDbAdapter';
import { config } from '../config';
import { Trainings } from '../enums/trainings';
import { AutobookingConfiguration, AutobookingConfigurationDto } from '../interfaces/autobookingConfiguration';
import { DatabaseAdapter } from '../interfaces/databaseAdapter';
import { DatabaseConfig } from '../interfaces/databaseConfig';
import { Repository } from '../interfaces/repository';
import { ConfigurationRepository } from '../repositories/configurationRepository';

export class AutobookingConfigurationFactory {

    public static async create(): Promise<AutobookingConfiguration> {

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

        return {
            trainingName: bookingConfig?.configuration.trainingName ?? Trainings.UNDEFINED,
            classTimeRange: bookingConfig?.configuration.classTimeRangeInit + ' - ' + bookingConfig?.configuration.classTimeRangeEnd,
            classtimeRangeInit: bookingConfig?.configuration.classTimeRangeInit ?? '',
            classtimeRangeEnd: bookingConfig?.configuration.classTimeRangeEnd ?? '',
            maxDaysInAdvance: bookingConfig?.configuration.maxDaysInAdvance ?? 0,
            isActive: bookingConfig?.configuration.isActive ?? false
        };

    }

}
