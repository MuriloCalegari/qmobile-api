import * as pool from './pool';
import { QBrowser } from './qbrowser';

export function create(): Promise<QBrowser> {
  return pool.acquire();
}

export async function shutdown(): Promise<void> {
  await pool.drain();
}
