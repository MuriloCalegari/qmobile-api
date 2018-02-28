import { Browser } from 'puppeteer';
import * as genericPool from 'generic-pool';
import * as puppeteer from 'puppeteer';

import { Factory, Pool } from 'generic-pool';
import { ConfigurationService } from '../../configs';

export namespace PoolService {

  let pool: Pool<Browser>;

  const FACTORY: Factory<Browser> = {
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

  export async function getPool(): Promise<Pool<Browser>> {
    if (!pool) {
      const { max_instances } = await ConfigurationService.getConfig();

      return pool = genericPool.createPool(FACTORY, {
        min: 1,
        max: max_instances,
        testOnBorrow: true,
        autostart: false
      });
    }
    return pool;
  }

}
