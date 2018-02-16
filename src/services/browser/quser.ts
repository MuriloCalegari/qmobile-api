import { QBrowser } from './../driver/qbrowser';
import * as webdriver from '../driver/webdriver';
import { HOME_PAGE } from '../../constants';
import { QSiteError } from '../errors/errors';
import * as cheerio from 'cheerio';

async function openHome(browser: QBrowser): Promise<void> {
  try {
    const page = browser.getPage();
    const home = browser.getEndpoint() + HOME_PAGE;
    const url = await page.url();
    if (url !== home) {
      await page.goto(home);
    }
  } catch (exc) {
    await browser.exit(true);
    throw new QSiteError(exc, 'Falha ao acessar ao servidor.');
  }
}

export async function getName(browser: QBrowser): Promise<string> {
  try {
    const page = browser.getPage();
    await openHome(browser);
    const dom = cheerio.load(await page.content());
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
    const page = browser.getPage();
    await openHome(browser);
    const base64 = (<string>await page.evaluate(`

      const c = document.createElement('canvas');
      const ctx = c.getContext('2d');
      const img = document.querySelector('.titulo img');
      c.width = img.naturalWidth || img.width;
      c.height = img.naturalHeight || img.height;
      ctx.drawImage(img, 0, 0, c.width, c.height);
      c.toDataURL();

    `)).replace(/^data:image\/png;base64,/, '');
    return new Buffer(base64, 'base64');
  } catch (exc) {
    await browser.exit(true);
    throw new QSiteError(exc, 'Falha ao buscar os dados');
  }
}
