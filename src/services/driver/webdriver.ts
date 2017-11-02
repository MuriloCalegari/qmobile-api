import { Builder, By, promise, ThenableWebDriver, IWebDriverOptionsCookie } from 'selenium-webdriver';
//import * as phantomjs from 'selenium-webdriver/phantomjs';
import { HOME_PAGE } from '../../constants';

import * as config from '../../configs';

promise.USE_PROMISE_MANAGER = false;

const builder = new Builder()
    .forBrowser('phantomjs');

const waitingQueue: ((browser: QBrowser) => void)[] = [];

export class QBrowser {

    private endpoint: string;
    inUse: boolean = true;
    offline: boolean = false;
    constructor(private driver: ThenableWebDriver) {

    }
    getDriver(): ThenableWebDriver {
        return this.driver;
    }
    setEndpoint(str: string): void {
        this.endpoint = str;
    }
    getEndpoint(): string {
        return this.endpoint;
    }
    async exit(error: boolean = false): Promise<void> {
        if (this.driver === null) return;
        const driver = this.getDriver();
        if (error) this.driver = null;
        try {
            const btnSair = await driver.findElement(By.css('a[href*="sair.asp"]'))
            await btnSair.click();
            await driver.wait(async () => {
                const readyState = await driver.executeScript('return document.readyState');
                return readyState === 'complete';
            });
        } catch (e) { }
        if (!error) {
            if (waitingQueue.length > 0) {
                waitingQueue.shift()(this);
            }
        } else {
            this.offline = true;
            try {
                await driver.quit();
            } catch (e) { }
        }
        this.inUse = false;
    }

}

const maxInstances = config.maxinstances || 30;

const browsers: QBrowser[] = [];

function getAvailableBrowser(): QBrowser {
    for (let i = browsers.length - 1; i >= 0 && i < browsers.length; i--) {
        const browser = browsers[i];
        if (browser.offline) {
            browsers.splice(i, 1);
        } else if (!browser.inUse) {
            return browser;
        }
    }
    return null;
}

export function create(): Promise<QBrowser> {
    let browser: QBrowser = getAvailableBrowser();
    if (browser != null) {
        browser.inUse = true;
        return Promise.resolve(browser);
    }
    if (browsers.length >= maxInstances) {
        return new Promise<QBrowser>((resolve, reject) => {
            waitingQueue.push(browser => {
                resolve(browser);
            });
        })
    }
    browser = new QBrowser(builder.build());
    browsers.push(browser);
    return Promise.resolve(browser);
}

export function shutdown(): Promise<void> {
    const proms = [];
    browsers.forEach(browser => {
        proms.push(browser.exit(true));
    })
    return <any>Promise.all(proms);
}