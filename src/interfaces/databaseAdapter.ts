export interface DatabaseAdapter {

    connect(): Promise<void>;

    disconnect(): Promise<void>;

    addOrUpdate(newData: any): Promise<any>;

    get<T = any>(filter: any): Promise<T[]>;

}