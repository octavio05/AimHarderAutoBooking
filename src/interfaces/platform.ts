import { IBookingResult } from "./IBookingResult";

export interface Platform {

    login(email: string, password: string): Promise<void>;
    doBooking(): Promise<IBookingResult>;

}