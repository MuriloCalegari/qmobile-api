import { Pool } from 'generic-pool';
import { Browser, Page } from 'puppeteer';

export class QBrowser {

  private endpoint: string | null = '';

  constructor(
    private driver: Browser | null,
    private page: Page | null,
    private pool: Pool<QBrowser>) {

  }

  getPage(): Page {
    return this.page as Page;
  }

  setEndpoint(str: string): void {
    this.endpoint = str;
  }

  getEndpoint(): string {
    return this.endpoint as string;
  }

  async isValid(): Promise<boolean> {
    if (!this.endpoint || !this.page) {
      return false;
    }
    try {
      await this.page.title();
      return true;
    } catch (e) {
      return false;
    }
  }

  async destroy(): Promise<void> {
    await this.driver!.close();
    this.driver = this.page = null;
  }

  async exit(error: boolean = false): Promise<void> {
    if (this.page) {
      const page = this.getPage();
      try {
        const btnSair = await page.$('a[href*="sair.asp"]');
        await btnSair!.click();
        await page.waitForNavigation();
      } catch (e) { }
      this.endpoint = '';
      if (error) {
        this.pool.destroy(this);
      } else {
        this.pool.release(this);
      }
    }
  }

}
