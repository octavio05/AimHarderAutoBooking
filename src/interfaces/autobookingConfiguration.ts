import { Trainings } from "../enums/trainings";

export interface AutobookingConfigurationDto {
    _id?: string;
    _rev?: string;
    configuration: {
        maxDaysInAdvance?: number;
        classTimeRangeInit: string;
        classTimeRangeEnd: string;
        trainingName?: Trainings;
        isActive: boolean;
    }
}

export interface AutobookingConfiguration {

    maxDaysInAdvance: number;
    classTimeRange: string
    trainingName: Trainings;
    isActive: boolean;

}