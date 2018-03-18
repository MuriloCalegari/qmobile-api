import { Page, Browser } from 'puppeteer';
import { IStrategy, PeriodoInfo, PeriodoCompleto } from './../factory';
import * as qauth from './qauth';
import * as quser from './quser';
import { QDiarios } from './qdiarios';
import { PoolService } from '../../driver/pool';

export class QAcademicoStrategy implements IStrategy {

  public browser: Browser = null as any;
  public page: Page = null as any;

  constructor(public endpoint: string) {
  }

  async init(): Promise<void> {
    if (!this.isLoggedIn()) {
      const pool = await PoolService.getPool();
      this.browser = await pool.acquire();
      this.page = await this.browser.newPage();
    }
  }

  async login(username: string, password: string): Promise<void> {
    if (!this.isLoggedIn()) {
      await this.init();
      await qauth.login(this, username, password);
    }
  }

  async getPeriodos(): Promise<PeriodoInfo[]> {
    return QDiarios.getPeriodos(this);
  }

  async getPeriodo(info: PeriodoInfo): Promise<PeriodoCompleto> {
    return QDiarios.getPeriodo(this, info);
  }

  isLoggedIn(): boolean {
    return !!this.page;
  }

  getFullName(): Promise<string> {
    return quser.getName(this);
  }

  getProfilePicture(): Promise<Buffer> {
    return quser.getPhoto(this);
  }

  async release(errored?: boolean): Promise<void> {
    const { page, browser } = this;
    if (page && browser) {
      const pool = await PoolService.getPool();
      try {
        const btnSair = await page.$('a[href*="sair.asp"]');
        await btnSair!.click();
        await page.waitForNavigation();
      } catch { }
      if (errored) {
        pool.destroy(browser);
      } else {
        pool.release(browser);
      }
      this.browser = this.page = null as any;
    }
  }

}
