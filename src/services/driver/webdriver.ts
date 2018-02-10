import * as genericPool from 'generic-pool';
import { Builder, By, promise, ThenableWebDriver } from 'selenium-webdriver';

import { HOME_PAGE } from '../../constants';

import * as config from '../../configs';
import { Factory } from 'generic-pool';

promise.USE_PROMISE_MANAGER = false;

const builder = new Builder()
  .forBrowser('phantomjs');

const factory: Factory<QBrowser> = {
  async create() {
    return new QBrowser(builder.build())
  },
  validate(client) {
    return client.isValid();
  },
  async destroy(client) {
    await client.destroy();
    return undefined;
  }
}

const pool = genericPool.createPool(factory, {
  min: 1,
  max: config.maxinstances || 2,
  testOnBorrow: true
});

export class QBrowser {

  private endpoint: string;

  constructor(private driver: ThenableWebDriver | null) {

  }

  getDriver(): ThenableWebDriver {
    return this.driver as ThenableWebDriver;
  }

  setEndpoint(str: string): void {
    this.endpoint = str;
  }

  getEndpoint(): string {
    return this.endpoint;
  }

  async isValid(): Promise<boolean> {
    if (!this.endpoint || !this.driver) {
      return false;
    }
    try {
      await this.driver.getTitle();
      return true;
    } catch (e) {
      return false;
    }
  }

  async destroy(): Promise<void> {
    if (!this.driver) return;
    const driver = this.getDriver();
    await driver.quit();
    this.driver = null;
  }

  async exit(error: boolean = false): Promise<void> {
    if (!this.driver) return;
    const driver = this.getDriver();
    try {
      const btnSair = await driver.findElement(By.css('a[href*="sair.asp"]'))
      await btnSair.click();
      await driver.wait(async () => {
        const readyState = await driver.executeScript('return document.readyState');
        return readyState === 'complete';
      });
    } catch (e) { }
    this.endpoint = '';
    if (error) {
      pool.destroy(this);
    } else {
      pool.release(this);
    }
  }

}

export function create(): Promise<QBrowser> {
  return pool.acquire();
}

export async function shutdown(): Promise<void> {
  await pool.drain();
}
