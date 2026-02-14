import { BrowserElement } from "./browserElement";

export interface BrowserAdapter {

    goto(url: string): Promise<void>;

    screenshot(path: string): Promise<void>;

    open(): Promise<void>;

    close(): Promise<void>;

    isOpen(): boolean;

    getElements(selector: string): Promise<BrowserElement[]>;

    waitForSelector(selector: string, options?: any | null): Promise<void>;

    getElement(selector: string): Promise<BrowserElement | null>;

    waitForTimeout(timeout: number): Promise<void>;

    scrollToBottom(): Promise<void>;

}