import cron, { ScheduledTask } from "node-cron";
import { Logger } from "../logger";
import { AutobookingConfigurationFactory } from "../factories/autobookingConfigurationFactory";
import { AutobookingConfiguration, DailyTraining } from "../interfaces/autobookingConfiguration";
import { Weekday } from "../enums/weekdays";
import { IBookingJobManager } from "../interfaces/IBookingJobManager";

export class BookingJobManager implements IBookingJobManager {

    private _log: Logger;
    private _bookingProcess: (training: DailyTraining, maxDaysInAdvance: number, log: Logger) => Promise<void>;
    private _currentBookingJob: ScheduledTask | null = null;
    private _isInitialized: boolean = false;
    private _isFirstExecution: boolean = true;

    public constructor(log: Logger, bookingProcess: (training: DailyTraining, maxDaysInAdvance: number, log: Logger) => Promise<void>) {

        if (!log)
            throw new Error('log is required');

        if (!bookingProcess)
            throw new Error('booking process is required');

        this._log = log;
        this._bookingProcess = bookingProcess;

    }

    public start(config: AutobookingConfiguration) {

        this.initializeEvents();
        this.scheduleBooking(config);

    }

    public stop() {

        this.stopCurrentBookingJob();

    }

    public async startNow(config: AutobookingConfiguration): Promise<void> {

        if (!config.isActive || !config.trainings || Object.keys(config.trainings).length === 0) {

            this._log.info('Autobooking is inactive or no trainings configured.');
            return;

        }

        const maxDays: number = config.maxDaysInAdvance ?? 0;
        const bookingDate: Date = new Date();
        bookingDate.setDate(bookingDate.getDate() + maxDays);

        const training: DailyTraining | undefined = this.getTrainingForDate(config, bookingDate, false);

        if (!training) {

            this._log.info(`No training configured on ${this.formatDate(bookingDate)}`);
            return;

        }

        this._log.info(`Starting booking process immediately for ${this.getWeekDay(bookingDate)}, ${this.formatDate(bookingDate)}` +
            ` at ${training.classTimeRangeInit} - ${training.classTimeRangeEnd} (${training.trainingName})`);

        await this._bookingProcess(training, maxDays, this._log);

    }

    private initializeEvents() {

        if (this._isInitialized) return;

        try {

            AutobookingConfigurationFactory.onChange((newConfig) => {

                this._log.info('Configuration changed, rescheduling...');
                this.scheduleBooking(newConfig);

            });

            this._isInitialized = true;

        } catch (error) {

            this._log.error((error as Error).stack!);

        }

    }

    private async scheduleBooking(config: AutobookingConfiguration) {

        this.stopCurrentBookingJob();

        if (!config.isActive || !config.trainings || Object.keys(config.trainings).length === 0) {

            this._log.info('Autobooking is inactive or no trainings configured.');
            return;

        }

        const maxDays: number = config.maxDaysInAdvance ?? 0;
        const bookingDate: Date = new Date();
        bookingDate.setDate(bookingDate.getDate() + maxDays);

        if (this._isFirstExecution) {

            this._isFirstExecution = false;
            await this.startNow(config);
            return;

        }

        const training: DailyTraining | undefined = this.getTrainingForDate(config, bookingDate);

        if (!training) {

            this._log.info(`No training configured on ${this.formatDate(bookingDate)}`);
            return;

        }

        const cronExpression: string = this.getCronExpression(training);

        this._currentBookingJob = cron.schedule(cronExpression, async () => {

            await this._bookingProcess(training, maxDays, this._log);

        });

        this._log.info(`Scheduled next job to book the class for ${this.getWeekDay(bookingDate)}, ${this.formatDate(bookingDate)}` +
            ` at ${training.classTimeRangeInit} - ${training.classTimeRangeEnd} (${training.trainingName})`);

    }

    private stopCurrentBookingJob() {

        if (this._currentBookingJob) {

            this._currentBookingJob.stop();
            this._currentBookingJob = null;
            this._log.info('Stopped current booking job');

        }

    }

    private formatDate(date: Date): string {

        const formatter = new Intl.DateTimeFormat('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });

        return formatter.format(date);

    }

    private getWeekDay(date: Date): string {

        return date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    }

    private getTrainingForDate(config: AutobookingConfiguration, bookingDate: Date, filterByReferenceDate: boolean = true): DailyTraining | undefined {

        const dayOfWeek: Weekday = this.getWeekDay(bookingDate) as Weekday;
        const training: DailyTraining | undefined = config.trainings?.[dayOfWeek];

        if (!training) return undefined;

        const [hours, minutes]: number[] = training.classTimeRangeInit.split(':').map(Number);
        const referenceDate: Date = new Date();
        referenceDate.setHours(hours, minutes, 0, 0);

        if (filterByReferenceDate && referenceDate <= new Date()) return undefined;

        return training;

    }

    private getCronExpression(training: DailyTraining): string {

        const [hour, minute]: number[] = training.classTimeRangeInit.split(':').map(Number);
        const currentDate: Date = new Date();

        return `${minute} ${hour} ${currentDate.getDate()} ${currentDate.getMonth() + 1} ${currentDate.getDay()}`;

    }

}
