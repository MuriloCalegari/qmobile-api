import { QBrowser } from './../driver/qbrowser';
import { By, until } from 'selenium-webdriver';
import * as webdriver from '../driver/webdriver';
import { LOGIN_PAGE } from '../../constants';
import { QError } from '../errors/errors';

export async function login(endpoint: string, username: string, password: string): Promise<QBrowser> {
  let browser: QBrowser | undefined;
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
    await driver.wait(async () =>
      driver.findElement(By.name('frmLogin')).then(_ => false, _ => true)
    );
    await driver.wait(async () =>
      await driver.executeScript('return document.readyState') === 'complete'
    );
    const titulo = await driver.getTitle();
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
