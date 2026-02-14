import { Browser, BrowserContext, Page } from "@playwright/test";
import { chromium } from "playwright-extra";
import { BrowserAdapter } from "../../interfaces/browserAdapter";
import { PlaywrightElementAdapter } from "./playwrightElementAdapter";
import { BrowserElement } from "../../interfaces/browserElement";

/**
 * PlaywrightAdapter class that implements the BrowserAdapter interface.
 * This class provides methods to interact with web pages using Playwright.
 */
export class PlaywrightAdapter implements BrowserAdapter {

    private _context: BrowserContext | null = null;
    private _browser: Browser | null = null;
    private _page: Page | null = null;

    // Lista de User-Agents modernos (Windows/Chrome & Edge) para rotación
    private readonly _userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0"
    ];

    /**
     * Opens the browser.
     */
    public async open() {

        await this.initialize();

    }

    /**
     * Gets the elements that match the given selector.
     * @param selector The selector to match.
     * @returns A promise that resolves to an array of BrowserElement objects.
     */
    public async getElements(selector: string): Promise<BrowserElement[]> {

        if (this._page === null)
            throw new Error('cannot get elements. browser is not open.');

        if (selector === null || selector === undefined || selector.trim() === '')
            throw new Error('selector cannot be null or empty');

        return (await this._page.locator(selector).all())
            .map((element) => new PlaywrightElementAdapter(element));

    }

    /**
     * Gets the element that matches the given selector.
     * @param selector The selector to match.
     * @returns A promise that resolves to a BrowserElement object or null if no element is found.
     */
    public async getElement(selector: string): Promise<BrowserElement | null> {

        if (this._page === null)
            throw new Error('cannot get elements. browser is not open.');

        if (selector === null || selector === undefined || selector.trim() === '')
            throw new Error('selector cannot be null or empty');

        const element = this._page.locator(selector);
        if (await element.count() === 0)
            return null;

        return new PlaywrightElementAdapter(element);

    }

    /**
     * Waits for the given selector to be present in the page.
     * @param selector The selector to wait for.
     * @param options Optional parameters for the wait.
     * @returns A promise that resolves when the selector is present.
     */
    public async waitForSelector(selector: string, options?: any | null): Promise<void> {

        if (this._page === null)
            throw new Error('cannot get elements. browser is not open.');

        if (selector === null || selector === undefined || selector.trim() === '')
            throw new Error('selector cannot be null or empty');

        await this._page.waitForSelector(selector, options);

    }

    /**
     * Waits for the given timeout in milliseconds.
     * @param timeout The timeout in milliseconds.
     * @returns A promise that resolves when the timeout is reached.
     */
    public async waitForTimeout(timeout: number): Promise<void> {

        if (this._page === null)
            throw new Error('cannot get elements. browser is not open.');

        await this._page.waitForTimeout(timeout);

    }

    /**
     * Navigates to the specified URL.
     * @param url URL to navigate to.
     * @throws Error if the URL is empty.
     */
    public async goto(url: string): Promise<void> {

        if (this._page === null)
            throw new Error('cannot get elements. browser is not open.');

        if (url === null || url === undefined || url.trim() === '')
            throw new Error('url cannot be null or empty');

        // Navegación más robusta
        try {
            await this._page!.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        } catch (e) {
            console.log("Navigation timeout or error, retrying...", e);
            await this._page!.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        }

        // Esperar comportamiento humano aleatorio
        await this._page.waitForTimeout(2000 + Math.random() * 3000);

        // Verificar que DataDome no está presente
        // Nota: A veces es mejor capturar el error que esperar activamente si no salta siempre
        try {
            const isDataDome = await this._page.evaluate(() => document.body.innerHTML.includes('datadome'));
            if (isDataDome) {
                console.error("DataDome detected!");
                // Aquí se podría implementar lógica de reintento con nueva IP/Contexto
            }
        } catch (e) { }

    }

    /**
     * Takes a screenshot of the current page. 
     * @param path Path to save the screenshot.
     */
    public async screenshot(path: string): Promise<void> {

        if (this._page)
            await this._page.screenshot({ path });

    }

    /**
     * Closes the browser and releases resources.
     */
    public async close(): Promise<void> {

        if (this._page) await this._page.close();
        if (this._context) await this._context.close();
        if (this._browser) await this._browser.close();
        this._context = null;
        this._page = null;
        this._browser = null;

    }

    /**
     * checks if the browser is open.
     * @returns true if the browser is open, false otherwise.
     */
    public isOpen(): boolean {

        return this._page !== null ||
            this._context !== null ||
            this._browser !== null;

    }

    /**
     * Scrolls to the bottom of the page.
     */
    public async scrollToBottom(): Promise<void> {

        if (!this._page)
            return;

        const scrollHeight = await this._page.evaluate(() => document.body.scrollHeight);
        let currentHeight = 0;

        while (currentHeight < scrollHeight) {

            currentHeight += 1000;
            if (currentHeight > scrollHeight)
                currentHeight = scrollHeight;

            await this._page.evaluate((height) => window.scrollTo(0, height), currentHeight);
            await this._page.waitForTimeout(1000);

        }

    }

    /**
     * Initializes the browser context.
     */
    private async initialize(): Promise<void> {

        this._browser = await this.createBrowser();

        // Selección aleatoria de User-Agent
        const userAgent = this._userAgents[Math.floor(Math.random() * this._userAgents.length)];

        this._context = await this._browser.newContext({
            userAgent: userAgent,
            viewport: { width: 1920, height: 1080 }, // Viewport más estándar de escritorio
            locale: 'es-ES',
            deviceScaleFactor: 1,
            isMobile: false,
            hasTouch: false,
            extraHTTPHeaders: {
                'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                'Upgrade-Insecure-Requests': '1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Referer': 'https://www.google.es/'
            }
        });

        this._page = await this.createPage(this._context!);

    }

    /**
     * Creates and configures a Playwright browser instance.
     * @returns A Promise that resolves to a Browser instance.
     */
    private async createBrowser(): Promise<Browser> {

        // chromium.use(StealthPlugin());

        return await chromium.launch({
            headless: false,
            args: [
                '--disable-blink-features=AutomationControlled',
                '--start-maximized',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-infobars',
                '--window-position=0,0',
                '--ignore-certifcate-errors',
                '--ignore-certifcate-errors-spki-list',
            ]
        });

    }

    /**
     * Creates and configures a new Page within the given BrowserContext.
     * @param context The BrowserContext to create the Page in. 
     * @returns A Promise that resolves to a Page instance. 
     */
    private async createPage(context: BrowserContext): Promise<Page> {

        const page: Page = await context.newPage();

        await page.addInitScript(() => {
            // navigator.webdriver -> undefined
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });

            // Simular plugins
            // @ts-ignore
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });

            // Simular languages
            // @ts-ignore
            Object.defineProperty(navigator, 'languages', { get: () => ['es-ES', 'es'] });

            // window.chrome
            // @ts-ignore
            window.chrome = { runtime: {} };

            // Pasar algunas comprobaciones de permission
            const originalQuery = (navigator.permissions as any)?.query;
            if (originalQuery) {
                // @ts-ignore
                navigator.permissions.query = (parameters: any) =>
                    parameters.name === 'notifications'
                        ? Promise.resolve({ state: Notification.permission })
                        : originalQuery(parameters);
            }
        });

        return page;

    }
}