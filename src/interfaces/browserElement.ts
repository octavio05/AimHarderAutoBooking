export interface BrowserElement {

    getAttribute(name: string): Promise<string | null>;

    textContent(): Promise<string | null>;

    getElement(selector: string): BrowserElement

    scrollIntoViewIfNeeded(): Promise<void>;

    click(options?: any | null): Promise<void>;

}