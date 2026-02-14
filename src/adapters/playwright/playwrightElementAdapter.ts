import { Locator } from "@playwright/test";
import { BrowserElement } from "../../interfaces/browserElement";

export class PlaywrightElementAdapter implements BrowserElement {

    private _element: Locator;

    /**
     * Constructor for PlaywrightElementAdapter.
     * @param element Locator object.
     * @throws Error if element is null or undefined.
     */
    public constructor(element: Locator) {

        if (element === null || element === undefined)
            throw new Error('element cannot be null or undefined');

        this._element = element;

    }

    /**
     * Gets the attribute value of the element.
     * @param name The attribute name.
     * @returns A promise that resolves to the attribute value or null if the element is not found.
     */
    public async getAttribute(name: string): Promise<string | null> {

        if (await this._element.count() === 0)
            return null;

        return await this._element.getAttribute(name);

    }

    /**
     * Gets the text content of the element.
     * @returns A promise that resolves to the text content or null if the element is not found.
     */
    public async textContent(): Promise<string | null> {

        if (await this._element.count() === 0)
            return null;

        return await this._element.textContent();

    }

    /**
     * Gets the element that matches the given selector.
     * @param selector The selector to match.
     * @returns A promise that resolves to a BrowserElement object or null if no element is found.
     */
    public getElement(selector: string): BrowserElement {

        const element = this._element.locator(selector).first();

        return new PlaywrightElementAdapter(element);

    }

    /**
     * Scrolls the element into view if needed.
     * @returns A promise that resolves when the element is scrolled into view.
     */
    public async scrollIntoViewIfNeeded(): Promise<void> {

        if (await this._element.count() === 0)
            return;

        await this._element.scrollIntoViewIfNeeded();

    }

    /**
     * Clicks the element.
     * @param options Optional parameters for the click.
     * @returns A promise that resolves when the element is clicked.
     */
    public async click(options?: any | null): Promise<void> {

        if (await this._element.count() === 0)
            return;

        await this._element.click(options);

    }

}