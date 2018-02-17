import * as pool from './pool';
import { QBrowser } from './qbrowser';

export function create(): Promise<QBrowser> {
  return pool.acquire();
}
