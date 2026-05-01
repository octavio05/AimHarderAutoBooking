import { Trainings } from "../enums/trainings";
import { Weekday } from "../enums/weekdays";

export interface AutobookingConfigurationDto {
    _id?: string;
    _rev?: string;
    configuration: AutobookingConfiguration;
}

export interface DailyTraining {
    trainingName: Trainings;
    classTimeRangeInit: string;
    classTimeRangeEnd: string;
}

export interface AutobookingConfiguration {
    maxDaysInAdvance?: number;
    isActive: boolean;
    trainings?: Partial<Record<Weekday, DailyTraining>>;
}