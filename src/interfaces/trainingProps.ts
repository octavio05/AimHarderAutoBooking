import { BrowserElement } from "./browserElement";

export interface TrainingProps {

    name?: string;
    date?: Date;
    time?: string;
    isBooked?: boolean;
    isAvailable?: boolean;
    onWaitingList?: boolean;
    button?: BrowserElement;

}