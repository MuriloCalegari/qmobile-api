import { QBrowser } from './../driver/qbrowser';
import * as webdriver from '../driver/webdriver';
import { HOME_PAGE } from '../../constants';
import { QSiteError } from '../errors/errors';
import * as cheerio from 'cheerio';

async function openHome(browser: QBrowser): Promise<void> {
  try {
    const driver = browser.getDriver();
    const home = browser.getEndpoint() + HOME_PAGE;
    const url = await driver.getCurrentUrl();
    if (url !== home) {
      await driver.get(home);
      await driver.wait(async () =>
        await driver.executeScript('return document.readyState') === 'complete'
      );
    }
  } catch (exc) {
    await browser.exit(true);
    throw new QSiteError(exc, 'Falha ao acessar ao servidor.');
  }
}

export async function getName(browser: QBrowser): Promise<string> {
  try {
    const driver = browser.getDriver();
    await openHome(browser);
    const dom = cheerio.load(await driver.getPageSource());
    const nome = dom('.barraRodape').eq(1).text().trim();
    if (!!nome) {
      return nome;
    } else {
      throw new Error('Name not found');
    }
  } catch (exc) {
    await browser.exit(true);
    throw new QSiteError(exc, 'Falha ao buscar os dados');
  }
}

export async function getPhoto(browser: QBrowser): Promise<Buffer> {
  try {
    const driver = browser.getDriver();
    await openHome(browser);
    const base64 = (await driver.executeScript<string>(`
                var c = document.createElement('canvas');
                var ctx = c.getContext('2d');
                var img = document.querySelector('.titulo img');
                c.width = img.naturalWidth || img.width;
                c.height = img.naturalHeight || img.height;
                ctx.drawImage(img, 0, 0, c.width, c.height);
                return c.toDataURL();
            `)).replace(/^data:image\/png;base64,/, '');
    return new Buffer(base64, 'base64');
  } catch (exc) {
    await browser.exit(true);
    throw new QSiteError(exc, 'Falha ao buscar os dados');
  }
}
