import { IStrategy, PeriodoInfo, PeriodoCompleto, RemoteBoletim } from './../factory';
import * as qauth from './qauth';
import * as quser from './quser';
import { QDiarios } from './qdiarios';
import { CookieJar } from 'tough-cookie';
import * as DataLoader from 'dataloader';
import * as request from 'request-promise';
import * as iconv from 'iconv-lite';
import { QBoletim } from './qboletim';

const ENCODING = process.env.NODE_ENV !== 'test' ? 'iso-8859-1' : 'utf8';

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

  async getBoletim(info: PeriodoInfo): Promise<RemoteBoletim[]> {
    const boletim = await QBoletim.getBoletim(this, info);
    return boletim.map(disciplina => ({
      disciplina: disciplina['Componente Curricular'],
      situacao: disciplina.Situação as any,
      etapa1: QDiarios.extractFloat(disciplina['1E']),
      etapa2: QDiarios.extractFloat(disciplina['2E']),
      rp_etapa1: QDiarios.extractFloat(disciplina['1R1E']),
      rp_etapa2: QDiarios.extractFloat(disciplina['1R2E'])
    }));
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
