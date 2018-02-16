import { QBrowser } from './../driver/qbrowser';
import * as webdriver from '../driver/webdriver';
import { LOGIN_PAGE } from '../../constants';
import { QError } from '../errors/errors';

export async function login(endpoint: string, username: string, password: string): Promise<QBrowser> {
  let browser: QBrowser | undefined;
  try {
    browser = await webdriver.create();
    browser.setEndpoint(endpoint);

    const page = browser.getPage();
    await page.goto(browser.getEndpoint() + LOGIN_PAGE);

    const form = await page.waitForSelector('[name=frmLogin]');
    const submit = await page.waitForSelector('[name=Submit]');
    await (await form.$('[name=LOGIN]'))!.type(username);
    await (await form.$('[name=SENHA]'))!.type(password);
    await submit!.click();

    await page.waitForNavigation();

    const titulo = await page.title();
    if (titulo.toLowerCase().includes('bem vindo')) {
      return browser;
    } else {
      throw new QError('Senha incorreta');
    }
  } catch (e) {
    if (browser && e instanceof QError === false) {
      try {
        await browser.exit(true);
      } catch { }
    }
    throw e;
  }
}
