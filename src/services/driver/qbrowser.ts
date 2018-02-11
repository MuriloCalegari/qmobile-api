import { ThenableWebDriver, By } from 'selenium-webdriver';
import { Pool } from 'generic-pool';

export class QBrowser {

  private endpoint: string;

  constructor(private driver: ThenableWebDriver | null, private pool: Pool<QBrowser>) {

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
    if (!this.driver) { return; }
    const driver = this.getDriver();
    await driver.quit();
    this.driver = null;
  }

  async exit(error: boolean = false): Promise<void> {
    if (!this.driver) { return; }
    const driver = this.getDriver();
    try {
      const btnSair = await driver.findElement(By.css('a[href*="sair.asp"]'));
      await btnSair.click();
      await driver.wait(async () => {
        const readyState = await driver.executeScript('return document.readyState');
        return readyState === 'complete';
      });
    } catch (e) { }
    this.endpoint = '';
    if (error) {
      this.pool.destroy(this);
    } else {
      this.pool.release(this);
    }
  }

}
