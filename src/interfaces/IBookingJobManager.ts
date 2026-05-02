import { AutobookingConfiguration } from "./autobookingConfiguration";

export interface IBookingJobManager {

    start(config: AutobookingConfiguration): void;
    stop(): void;

}