import { Browser } from 'puppeteer';
import * as genericPool from 'generic-pool';
import * as puppeteer from 'puppeteer';

import * as config from '../../configs';
import { Factory, Pool } from 'generic-pool';


let pool: Pool<Browser>;

const factory: Factory<Browser> = {
  create() {
    return puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });
  },
  async validate(client) {
    try {
      const pages = await client.pages();
      for (const page of pages) {
        await page.title();
      }
      return true;
    } catch {
      return false;
    }
  },
  async destroy(client) {
    await client.close();
    return undefined;
  }
};

pool = genericPool.createPool(factory, {
  min: 1,
  max: config.maxinstances || 2,
  testOnBorrow: true,
  autostart: false
});

export = pool;
