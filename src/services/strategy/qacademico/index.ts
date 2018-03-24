import { IStrategy, PeriodoInfo, PeriodoCompleto } from './../factory';
import axios from 'axios';
import * as qauth from './qauth';
import * as quser from './quser';
import { QDiarios } from './qdiarios';
import { CookieJar } from 'tough-cookie';
import * as DataLoader from 'dataloader';
import axiosCookieJarSupport from 'axios-cookiejar-support';

axiosCookieJarSupport(axios);

export class QAcademicoStrategy implements IStrategy {

  options: any;
  httpLoader: DataLoader<string, any>;

  constructor(public endpoint: string) {
    this.httpLoader = new DataLoader(async urls => Promise.all(
      urls.map(url =>
        axios.get(url, this.options)
      )
    ));
  }

  init(): void {
    if (!this.options) {
      this.options = {
        jar: new CookieJar(),
        withCredentials: true
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
    this.options = null;
  }

  getUrl(url: string): Promise<any> {
    return this.httpLoader.load(url);
  }

}
