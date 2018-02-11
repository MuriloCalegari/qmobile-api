import { QBrowser } from './qbrowser';
import * as genericPool from 'generic-pool';
import { Builder, promise } from 'selenium-webdriver';

import * as config from '../../configs';
import { Factory, Pool } from 'generic-pool';

promise.USE_PROMISE_MANAGER = false;

const builder = new Builder()
  .forBrowser('phantomjs');

let pool: Pool<QBrowser>;

const factory: Factory<QBrowser> = {
  async create() {
    return new QBrowser(builder.build(), pool);
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
  testOnBorrow: true
});

export = pool;
