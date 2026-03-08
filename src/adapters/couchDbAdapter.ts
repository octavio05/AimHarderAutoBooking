import nano from "nano";
import { DatabaseAdapter } from "../interfaces/databaseAdapter";
import { DatabaseConfig } from "../interfaces/databaseConfig";

/**
 * Adapter for CouchDB
 */
export class CouchDbAdapter implements DatabaseAdapter {

    private readonly _config: DatabaseConfig;
    private _connection: nano.ServerScope | null = null;

    /**
     * Constructor
     * @param config Database configuration 
     * @throws Error if any of the parameters are null or empty.
     */
    constructor(config: DatabaseConfig) {

        this.validateConfig(config);

        this._config = config;

    }

    /** 
     * Connect to CouchDB
     */
    public async connect(): Promise<void> {

        this._connection = nano(this.getConnectionString());

        const dbList: string[] = await this._connection.db.list();

        if (!dbList.includes(this._config.dbName))
            await this._connection.db.create(this._config.dbName);

    }

    /**
     * Disconnect from CouchDB
     */
    public async disconnect(): Promise<void> {

        if (this._connection) {

            this._connection.relax({ method: 'head', path: '/' });
            this._connection = null;

        }

    }

    /**
     * Adds or updates an ad in the database
     * @param newData Data to add or update
     * @throws Error if the connection is not established.
     */
    public async addOrUpdate(newData: any): Promise<any> {

        const database = this._connection?.db.use<any>(this._config!.dbName);

        let data = (await database!.find({
            selector: {
                _id: newData._id,
            }
        })).docs[0];

        if (!data) {
            data = newData;
        } else {
            // Preservamos el _rev de la base de datos para evitar el conflicto 409
            const { _rev, ...newDataWithoutRev } = newData;
            data = {
                ...data,
                ...newDataWithoutRev,
            };
        }

        const response = await database!.insert(data);

        if (!response.ok)
            throw new Error('Error adding or updating ad');

        data._id = response.id;
        data._rev = response.rev;

        return data;

    }

    /**
     * Gets ads from the database based on a filter
     * @param filter Filter criteria
     * @returns Collection of ads
     * @throws Error if the connection is not established.
     */
    public async get<T>(filter: any): Promise<T[]> {

        const database = this._connection?.db.use<T>(this._config.dbName);
        const ads = (await database!.find({
            selector: filter
        })).docs;

        return ads;

    }

    /**
     * Creates the connection string for the connection
     * @returns Connection string
     */
    private getConnectionString(): string {

        return `http://${this._config.user}:${this._config.password}@${this._config.host}:${this._config.port}`;

    }

    /**
     * Validates the database configuration.
     * @param config Database configuration.
     * @throws Error if any of the parameters are null or empty.
     */
    private validateConfig(config: DatabaseConfig) {

        if (config === null || config === undefined)
            throw new Error('config cannot be null or undefined');

        if (config.user === null || config.user === undefined || config.user.trim() === '')
            throw new Error('user cannot be null or empty');

        if (config.password === null || config.password === undefined || config.password.trim() === '')
            throw new Error('password cannot be null or empty');

        if (config.host === null || config.host === undefined || config.host.trim() === '')
            throw new Error('host cannot be null or empty');

        if (config.port === null || config.port === undefined)
            throw new Error('port cannot be null or undefined');

        if (config.dbName === null || config.dbName === undefined || config.dbName.trim() === '')
            throw new Error('dbName cannot be null or empty');

    }
}