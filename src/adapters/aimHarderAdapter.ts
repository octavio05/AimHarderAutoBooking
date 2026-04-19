import { Platform } from "../interfaces/platform";
import { BrowserElement } from "../interfaces/browserElement";
import { BrowserAdapter } from "../interfaces/browserAdapter";
import { IBookingResult } from "../interfaces/IBookingResult";
import { BookingResult } from "../models/bookingResult";
import { Training } from "../models/training";

export class AimHarderAdapter implements Platform {

    private _browser: BrowserAdapter;
    private _simulation: boolean;
    private loginUrl = 'https://login.aimharder.com/';
    private maxBookingAdvanceDays = 3;
    private classTimeRange = '15:30 - 16:30';
    private trainingName = 'CROSSFIT';

    public constructor(browser: BrowserAdapter, simulation: boolean) {

        if (browser === null || browser === undefined)
            throw new Error('browser cannot be null or undefined');

        this._browser = browser;
        this._simulation = simulation ?? true;

    }

    public async login(email: string, password: string): Promise<void> {

        if (email === null || email === undefined || email.trim() === '')
            throw new Error('email cannot be null or empty');

        if (password === null || password === undefined || password.trim() === '')
            throw new Error('password cannot be null or empty');

        if (!this._browser.isOpen()) {

            await this._browser.open();
            await this._browser.goto(this.loginUrl);

        }

        await this.acceptCookies();
        await this._browser.waitForTimeout(3000);
        await this.writeUserName(email);
        await this.writePassword(password);
        await this.clickLogin();

    }

    public async doBooking(): Promise<IBookingResult> {

        let result = new BookingResult();

        await this.goToBookings();
        await this._browser.waitForTimeout(10000);
        await this.goToBookingDay();
        const training = await this.getTrainingOfTheDayInTime();

        if (training.length === 0) {

            result.message = `❌ No classes were found on ${this.getBookingDate().toLocaleDateString()} at ${this.classTimeRange}`;
            return result;

        }

        if (training.find(t => t.onWaitingList && t.name.toUpperCase() === this.trainingName)) {

            result.message = `🕐 [${this.trainingName}] Class is on waiting list on ${this.getBookingDate().toLocaleDateString()} at ${this.classTimeRange}`;
            return result;

        }

        if (training.find(t => t.isBooked && t.name.toUpperCase() === this.trainingName)) {

            result.message = `✅ [${this.trainingName}] Class is already booked on ${this.getBookingDate().toLocaleDateString()} at ${this.classTimeRange}`;
            return result;

        }

        if (training.find(t => !t.isAvailable && t.name.toUpperCase() === this.trainingName)) {

            result.message = `❌ [${this.trainingName}] Class is not available on ${this.getBookingDate().toLocaleDateString()} at ${this.classTimeRange}`;
            return result;

        }

        if (!this._simulation)
            await training.find(t => t.name.toUpperCase() === this.trainingName)?.button?.click();

        result.success = true;
        result.message = `✅ [${this.trainingName}] Class booked on ${this.getBookingDate().toLocaleDateString()} at ${this.classTimeRange}`;
        return result;

    }

    private getBookingDate(): Date {

        const date = new Date();
        date.setDate(date.getDate() + this.maxBookingAdvanceDays);
        return date;

    }

    private async write(selector: string, text: string) {

        await this._browser.waitForSelector(selector);
        const input: BrowserElement | null = await this._browser.getElement(selector);

        if (input === null || input === undefined)
            throw new Error(`${selector} not found`);

        await input.type(text);

    }

    private async click(selector: string, index?: number) {

        await this._browser.waitForSelector(selector);
        const button: BrowserElement[] | null = await this._browser.getElements(selector);

        if (button === null || button === undefined)
            throw new Error(`${selector} not found`);

        if (index)
            await button[index].click();
        else
            await button[0].click();

    }

    private async acceptCookies() {

        await this.click('.conCookie a', 0);

    }

    private async writeUserName(userName: string) {

        await this.write('input[name="username"]', userName);

    }

    private async writePassword(password: string) {

        await this.write('input[name="password"]', password);

    }

    private async clickLogin() {

        await this.click('button[type="submit"]');

    }

    private async goToBookings() {

        await this.click('.ahPicReservations');

    }

    private async goToBookingDay() {

        for (let i = 0; i < this.maxBookingAdvanceDays; i++) {

            await this._browser.waitForSelector('#nextDay');
            await this.click('#nextDay');
            await this._browser.waitForTimeout(3000);

        }

    }

    private async getTrainingOfTheDayInTime(): Promise<Training[]> {

        await this._browser.waitForSelector('#clasesDiaSel');
        const allTrainingOfTheDay: BrowserElement[] | null = await this._browser.getElements('#clasesDiaSel div');

        if (!allTrainingOfTheDay)
            return [];

        const trainings = await Promise.all(allTrainingOfTheDay.map(async (cod) => {

            const time = await cod.getElement('.rvHora').textContent();

            if (time === this.classTimeRange)
                return new Training({
                    name: await cod.getElement('.rvNombreCl').textContent() || '',
                    date: this.getBookingDate(),
                    time: time,
                    isBooked: await this.isTrainingBooked(cod),
                    isAvailable: await this.isTrainingAvailable(cod),
                    onWaitingList: await this.isOnWaitingList(cod),
                    button: await this.getBookingButton(cod)
                });

        }));

        return trainings.filter((t): t is Training => t !== undefined);

    }

    private async isTrainingBooked(trainingElement: BrowserElement): Promise<boolean> {

        const bookedElement = trainingElement.getElement('.rvBooked');
        return await bookedElement.getAttribute('class') !== null;

    }

    private async isOnWaitingList(trainingElement: BrowserElement): Promise<boolean> {

        const waitingListElement = trainingElement.getElement('.rvLista');
        return await waitingListElement.getAttribute('class') !== null;

    }

    private async getBookingButton(element: BrowserElement): Promise<BrowserElement | undefined> {

        const buttons = await element.getElements('.controlesClase a');
        for (const b of buttons) {

            const text = await b.textContent();
            if (text === 'Reservar')
                return b;

        }

        return undefined;

    }

    private async isTrainingAvailable(trainingElement: BrowserElement): Promise<boolean> {

        const occupiedPlacedText = await trainingElement.getElement('.rvOcupacion').textContent();
        if (occupiedPlacedText === null)
            return false;

        const regex = /\d{1,2}\/\d{1,2}/;
        const match = occupiedPlacedText.match(regex);
        if (!match)
            return false;

        const [occupied, total] = match[0].split('/');
        if (parseInt(occupied) >= parseInt(total))
            return false;

        const bookingButton = await this.getBookingButton(trainingElement);
        return !!bookingButton;

    }

}