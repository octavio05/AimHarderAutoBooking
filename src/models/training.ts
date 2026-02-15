import { BrowserElement } from "../interfaces/browserElement";
import { TrainingProps } from "../interfaces/trainingProps";

export class Training {

    public name: string;
    public date: Date;
    public time: string;
    public isBooked: boolean;
    public isAvailable: boolean;
    public onWaitingList: boolean;
    public button?: BrowserElement;

    constructor({
        name = '',
        date = new Date(),
        time = '',
        isBooked = false,
        isAvailable = false,
        onWaitingList = false,
        button = undefined
    }: TrainingProps = {}) {

        this.name = name;
        this.date = date;
        this.time = time;
        this.button = button;
        this.isBooked = isBooked;
        this.isAvailable = isAvailable;
        this.onWaitingList = onWaitingList;
    }

}