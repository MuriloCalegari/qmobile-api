import { Builder, By, until, promise, ThenableWebDriver } from 'selenium-webdriver';
import * as webdriver from '../driver/webdriver';
import { HOME_PAGE } from '../../constants';
import { QSiteError } from '../errors/errors';

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
            const nome = await driver.findElement(By.xpath('/html/body/table/tbody/tr[3]/td/table/tbody/tr/td[3]')).getText();
            resolve(nome);
        } catch (exc) {
            reject(new QSiteError(exc, "Falha ao buscar os dados"));
        }
    });
}