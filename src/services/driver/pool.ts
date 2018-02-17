import { QBrowser } from './qbrowser';
import * as genericPool from 'generic-pool';
import * as puppeteer from 'puppeteer';

import * as config from '../../configs';
import { Factory, Pool } from 'generic-pool';


let pool: Pool<QBrowser>;

const factory: Factory<QBrowser> = {
  async create() {
    const driver = await puppeteer.launch();
    const page = await driver.newPage();
    return new QBrowser(driver, page, pool);
  },
  validate(client) {
    return client.isValid();
  },
  async destroy(client) {
    await client.destroy();
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
