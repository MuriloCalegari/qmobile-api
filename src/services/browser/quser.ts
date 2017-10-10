import { Builder, By, until, promise, ThenableWebDriver } from 'selenium-webdriver';
import * as webdriver from '../driver/webdriver';
import { HOME_PAGE } from '../../constants';
import { QSiteError } from '../errors/errors';
import * as cheerio from 'cheerio';

export function getName(browser: webdriver.QBrowser): Promise<string> {
    return new Promise(async (resolve, reject) => {
        try {
            const driver = browser.getDriver();
            const home = browser.getEndpoint() + HOME_PAGE;
            const url = await driver.getCurrentUrl();
            if (url != home) {
                await driver.get(home);
                await driver.wait(async () => {
                    const readyState = await driver.executeScript('return document.readyState');
                    return readyState === 'complete';
                });
            }
            const dom = cheerio.load(await driver.getPageSource());
            const nome = dom('.barraRodape').eq(1).text().trim();
            console.log(nome);
            resolve(nome);
        } catch (exc) {
            reject(new QSiteError(exc, "Falha ao buscar os dados"));
        }
    });
}