export interface Repository<T> {

    get(): Promise<T | undefined>;

    addOrUpdate(data: T): Promise<T>;

}