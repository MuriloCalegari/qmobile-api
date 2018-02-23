import { Page, Browser } from 'puppeteer';
import { IStrategy, RemoteTurma } from './../factory';
import * as qauth from './qauth';
import * as quser from './quser';
import * as pool from '../../driver/pool';
import { QDiarios } from './qdiarios';

export class QAcademicoStrategy implements IStrategy {

  public browser: Browser = null as any;
  public page: Page = null as any;

  constructor(public endpoint: string) {
  }

  async init(): Promise<void> {
    if (!this.isLoggedIn()) {
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

  isLoggedIn(): boolean {
    return !!this.page;
  }

  getTurmas(): Promise<RemoteTurma[]> {
    return QDiarios.getTurmas(this);
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
