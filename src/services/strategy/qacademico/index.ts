import { IStrategy, PeriodoInfo, PeriodoCompleto } from './../factory';
import * as qauth from './qauth';
import * as quser from './quser';
import { QDiarios } from './qdiarios';
import { CookieJar } from 'tough-cookie';
import * as DataLoader from 'dataloader';
import * as request from 'request-promise';
import * as iconv from 'iconv-lite';

const ENCODING = 'iso-8859-1';

export class QAcademicoStrategy implements IStrategy {

  options: request.RequestPromiseOptions;
  httpLoader: DataLoader<string, string>;

  constructor(public endpoint: string) {
    this.httpLoader = new DataLoader(async urls => Promise.all(
      urls.map(async url => {

        const res = await request.get(url, this.options);
        return iconv.decode(res, ENCODING);

      })
    ));
  }

  init(): void {
    if (!this.options) {
      this.options = {
        jar: request.jar(),
        followAllRedirects: true,
        encoding: null
      };
    }
  }

  async login(username: string, password: string): Promise<void> {
    if (!this.isLoggedIn()) {
      this.init();
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
    return !!this.options;
  }

  getFullName(): Promise<string> {
    return quser.getName(this);
  }

  getProfilePicture(): Promise<Buffer> {
    return quser.getPhoto(this);
  }

  async release(errored?: boolean): Promise<void> {
    this.httpLoader.clearAll();
    this.options = null as any;
  }

  getUrl(url: string): Promise<string> {
    return this.httpLoader.load(url);
  }

  async getFile(url: string): Promise<Buffer> {
    return await request.get(url, this.options);
  }

  async postUrl(url: string, data: any): Promise<string> {
    const res = await request.post({
      ...this.options,
      method: 'POST',
      url,
      form: data
    });
    return iconv.decode(res, ENCODING);
  }

}
