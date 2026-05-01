import { CouchDbAdapter } from '../adapters/couchDbAdapter';
import { config } from '../config';
import { AutobookingConfiguration, AutobookingConfigurationDto } from '../interfaces/autobookingConfiguration';
import { DatabaseAdapter } from '../interfaces/databaseAdapter';
import { DatabaseConfig } from '../interfaces/databaseConfig';
import { Repository } from '../interfaces/repository';
import { ConfigurationRepository } from '../repositories/configurationRepository';

export class AutobookingConfigurationFactory {

    private static _repository: Repository<AutobookingConfigurationDto> | undefined;

    private static mapToConfiguration(dto: AutobookingConfigurationDto | undefined): AutobookingConfiguration {

        return {
            maxDaysInAdvance: dto?.configuration?.maxDaysInAdvance ?? 0,
            isActive: dto?.configuration?.isActive ?? false,
            trainings: dto?.configuration?.trainings ?? {}
        };

    }

    private static getRepository(): Repository<AutobookingConfigurationDto> {

        if (this._repository)
            return this._repository;

        const databaseConfig: DatabaseConfig = {
            user: config.DB_USER,
            password: config.DB_PASSWORD,
            host: config.DB_HOST,
            port: config.DB_PORT,
            dbName: config.DB_NAME
        };

        const database: DatabaseAdapter = new CouchDbAdapter(databaseConfig);

        this._repository = new ConfigurationRepository(database);

        return this._repository;

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
