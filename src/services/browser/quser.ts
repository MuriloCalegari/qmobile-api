import { Builder, By, until, promise, ThenableWebDriver } from 'selenium-webdriver';
import * as webdriver from '../driver/webdriver';
import { HOME_PAGE } from '../../constants';
import { QSiteError } from '../errors/errors';
import * as cheerio from 'cheerio';

function openHome(browser: webdriver.QBrowser): Promise<void> {
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
            resolve();
        } catch (e) {
            await browser.exit(true);
            reject();
        }
    })
}

export function getName(browser: webdriver.QBrowser): Promise<string> {
    return new Promise(async (resolve, reject) => {
        try {
            const driver = browser.getDriver();
            await openHome(browser);
            const dom = cheerio.load(await driver.getPageSource());
            const nome = dom('.barraRodape').eq(1).text().trim();
            resolve(nome);
        } catch (exc) {
            await browser.exit(true);
            reject(new QSiteError(exc, "Falha ao buscar os dados"));
        }
    });
}

export function getPhoto(browser: webdriver.QBrowser): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
        try {
            const driver = browser.getDriver();
            await openHome(browser);
            const base64 = (<string>await driver.executeScript(`
                var c = document.createElement("canvas");
                var ctx = c.getContext("2d");
                var img = document.querySelector(".titulo img");
                c.width = img.naturalWidth || img.width;
                c.height = img.naturalHeight || img.height;
                ctx.drawImage(img, 0, 0, c.width, c.height);
                return c.toDataURL();
            `)).replace(/^data:image\/png;base64,/, "");
            const buffer = new Buffer(base64, 'base64');
            resolve(buffer);
        } catch (exc) {
            await browser.exit(true);
            reject(new QSiteError(exc, "Falha ao buscar os dados"));
        }
    });
}