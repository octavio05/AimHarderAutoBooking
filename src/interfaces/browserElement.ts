export interface BrowserElement {

    getAttribute(name: string): Promise<string | null>;

    textContent(): Promise<string | null>;

    getElement(selector: string): BrowserElement

    getElements(selector: string): Promise<BrowserElement[]>;

    scrollIntoViewIfNeeded(): Promise<void>;

    click(options?: any | null): Promise<void>;

    type(text: string): Promise<void>;

}