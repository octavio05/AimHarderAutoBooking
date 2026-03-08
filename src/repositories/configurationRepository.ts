import { AutobookingConfigurationDto } from "../interfaces/autobookingConfiguration";
import { DatabaseAdapter } from "../interfaces/databaseAdapter";
import { Repository } from "../interfaces/repository";

export class ConfigurationRepository implements Repository<AutobookingConfigurationDto> {

    private readonly _database: DatabaseAdapter;

    constructor(database: DatabaseAdapter) {

        if (database === null || database === undefined)
            throw new Error('database cannot be null or undefined');

        this._database = database;

    }

    public async get(): Promise<AutobookingConfigurationDto | undefined> {

        await this._database.connect();

        try {

            return (await this._database.get<AutobookingConfigurationDto>({}))[0];

        }
        finally {

            await this._database.disconnect();

        }

    }

    public async addOrUpdate(data: AutobookingConfigurationDto): Promise<AutobookingConfigurationDto> {

        await this._database.connect();

        try {

            return await this._database.addOrUpdate(data);

        }
        finally {

            await this._database.disconnect();

        }

    }

    public onChange(callback: () => void): void {

        this._database.onChange(callback);

    }

}