import { PeriodoInfo } from './../factory';
import { BOLETIM_PAGE } from './../../../constants';
import { QAcademicoStrategy } from './index';
import * as cheerio from 'cheerio';
import * as qs from 'querystring';

export namespace QBoletim {

  export interface RegistroBoletim {
    [key: string]: string;
  }

  function clean(str: string): string {
    return str.trim().replace('\t', ' ').replace('  ', ' ');
  }

  function getHeader(dom: CheerioStatic): string[] {
    const headerElem = dom('table:nth-child(7) > tbody > tr.rotulo');
    return parseRow(dom, headerElem);
  }

  function getDisciplinas(dom: CheerioStatic): string[][] {
    const disciplinas_elems = dom('table:nth-child(7) > tbody > tr.conteudoTexto').toArray();
    return disciplinas_elems
      .map(elem => parseRow(dom, dom(elem)));
  }

  function parseRow(dom: CheerioStatic, row: Cheerio): string[] {
    return row
      .find('td')
      .toArray()
      .map((elem) => clean(dom(elem).text()));
  }


  export async function getBoletim(strategy: QAcademicoStrategy, periodo: PeriodoInfo): Promise<RegistroBoletim[]> {
    const [ano, num_periodo] = periodo.codigo.split('_');
    const query = qs.stringify({
      cmbanos: ano,
      cmbperiodos: num_periodo
    });

    const pagina = await strategy.getUrl(strategy.endpoint + BOLETIM_PAGE + '&' + query);
    const dom = cheerio.load(pagina);

    const header = getHeader(dom);
    const disciplinas_arr = getDisciplinas(dom);

    return disciplinas_arr.map(disciplina => {
      const obj = {};
      disciplina.forEach((value, i) => {
        obj[header[i]] = value;
      });
      return obj;
    });
  }

}
