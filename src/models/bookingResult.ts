import { IBookingResult } from "../interfaces/IBookingResult";

export class BookingResult implements IBookingResult {

    public success: boolean = false;
    public message: string = '';

}