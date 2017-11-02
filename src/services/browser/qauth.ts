import * as moment from 'moment';
import { Builder, By, until, promise, ThenableWebDriver } from 'selenium-webdriver';
import * as webdriver from '../driver/webdriver';
import { LOGIN_PAGE } from '../../constants';
import { QError } from '../errors/errors';

export function login(endpoint: string, username: string, password: string): Promise<webdriver.QBrowser> {
    return new Promise(async (resolve, reject) => {
        let browser: webdriver.QBrowser = null;
        try {
            browser = await webdriver.create();
            browser.setEndpoint(endpoint);
            const driver = browser.getDriver();
            await driver.get(browser.getEndpoint() + LOGIN_PAGE);
            await driver.wait(async () => {
                const readyState = await driver.executeScript('return document.readyState');
                return readyState === 'complete';
            });
            const form = await driver.findElement(By.name('frmLogin'));
            await driver.wait(until.elementLocated(By.name('Submit')));
            await form.findElement(By.name('LOGIN')).sendKeys(username);
            await form.findElement(By.name('SENHA')).sendKeys(password);
            await form.findElement(By.name('Submit')).click();
            await driver.wait(async () => {
                return driver.findElement(By.name('frmLogin')).then(() => false, () => true);
            });
            await driver.wait(async () => {
                const readyState = await driver.executeScript('return document.readyState');
                return readyState === 'complete';
            });
            const titulo = await driver.getTitle();
            if (titulo.toLowerCase().indexOf('bem vindo') !== -1) {
                resolve(browser);
            } else {
                reject(new QError('Senha incorreta'));
            }
        } catch (e) {
            if (browser !== null) {
                browser.exit(true)
                    .then(() => reject(e))
                    .catch(() => reject(e));
            } else {
                reject(e);
            }
        }
    });
}