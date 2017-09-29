import { Builder, promise, ThenableWebDriver, IWebDriverOptionsCookie } from 'selenium-webdriver';
import * as firefox from 'selenium-webdriver/firefox';
import { HOME_PAGE } from '../../constants';

promise.USE_PROMISE_MANAGER = false;

const binary = new firefox.Binary();
binary.addArguments("--headless");

const builder = new Builder()
                    .forBrowser('firefox')
                    .setFirefoxOptions(
                        new firefox.Options().setBinary(binary)
                    );

export class QBrowser {

    private endpoint: string;
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
    exit(): promise.Promise<void> {
        return this.driver.quit();
    }

}

export function create() {
    return new QBrowser(builder.build());
}
export function getBinary() {
    return binary;
}