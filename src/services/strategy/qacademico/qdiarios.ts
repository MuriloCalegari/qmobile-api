import { PeriodoCompleto } from './../factory';
import { QAcademicoStrategy } from './index';
import * as cheerio from 'cheerio';
import * as moment from 'moment';
import { DIARIOS_PAGE } from '../../../constants';
import {
  RemoteNota,
  RemoteEtapa,
  RemoteDisciplina,
  NumeroEtapa,
  PeriodoInfo
} from '../factory';
import { ElementHandle } from 'puppeteer';

export namespace QDiarios {

  export async function openDiarios(strategy: QAcademicoStrategy): Promise<void> {
    try {
      const { endpoint, page } = strategy;
      const diarios = endpoint + DIARIOS_PAGE;
      const url = await page.url();
      if (url !== diarios) {
        await page.goto(diarios);
      }
    } catch (e) {
      await strategy.release(true);
      throw e;
    }
  }

  function extractFloat(val: string): number {
    return parseFloat(val.replace(/[^0-9\.]/g, '')) || -1;
  }

  function extractInt(val: string): number {
    return parseInt(val.replace(/[^0-9]/g, ''), 10);
  }

  function readNota(dom: CheerioStatic, preelem: CheerioElement): RemoteNota {
    const element = dom(preelem);
    const [
      _,
      descricao,
      peso,
      notamaxima,
      nota
    ] = element.children('td').toArray().map(e => dom(e).text());
    return {
      descricao: (
        descricao
      ).replace(/\([a-zA-Z0-9]+\)/g, '').replace(/\s\s+/g, ' ').trim(),
      peso: extractFloat(peso),
      notamaxima: extractFloat(notamaxima),
      nota: extractFloat(nota),
    };
  }

  function readEtapa(dom: CheerioStatic, preelem: CheerioElement): RemoteEtapa | null {
    const element = dom(preelem);
    if (!element.hasClass('conteudoTexto')) {
      return null;
    }
    const numEtapa = extractInt(element.find('div.conteudoTitulo').text());
    const tbody = element.find('tbody');
    const notas = tbody.children('tr').toArray().map(tr => readNota(dom, tr));
    return {
      numero: numEtapa,
      notas
    };
  }

  async function getDisciplinas(strategy: QAcademicoStrategy): Promise<RemoteDisciplina[]> {
    try {
      const { page } = strategy;
      await openDiarios(strategy);
      const dom = cheerio.load(await page.content());
      const tabelaNotas = dom(
        `table tr:nth-child(2) > td > table tr:nth-child(2) > td:nth-child(2) >
        table:nth-child(3) > tbody td:nth-child(2) table:nth-child(3) > tbody`
      );
      const trs = tabelaNotas.children('tr').toArray();
      const periodo = moment(dom('span.dado_cabecalho').text(), 'YYYY/MM').toDate();

      const disciplinas: RemoteDisciplina[] = trs.map((elem, i) => {

        const tr = dom(elem);
        if (!tr.hasClass('conteudoTexto') && !tr.hasClass('rotulo')) {
          const descricao = tr.find('td.conteudoTexto').text();
          const [_, turma, nome, professor] = descricao.split('-')
            .map(p => p && p.trim().replace(/\([a-zA-Z0-9]+\)/g, ''));
          const etapas: RemoteEtapa[] = [];
          for (let j = 1; j <= 4 && i + j < trs.length; j++) {
            const etapa = readEtapa(dom, trs[i + j]);
            if (etapa) {
              if (etapa.numero === 11) {
                etapa.numero = NumeroEtapa.RP_ETAPA1;
              } else if (etapa.numero === 12) {
                etapa.numero = NumeroEtapa.RP_ETAPA2;
              }
              etapas.push(etapa);
            } else {
              break;
            }
          }
          return {
            turma,
            nome,
            professor: professor || '',
            etapas,
            periodo
          };
        }

      }).filter(d => !!d) as any;

      return disciplinas;
    } catch (e) {
      await strategy.release(true);
      throw e;
    }
  }

  async function openSelect(strategy: QAcademicoStrategy): Promise<void> {
    await QDiarios.openDiarios(strategy);
    const { page } = strategy;
    const atual = await page.$('span.dado_cabecalho');
    const parent = (await atual!.getProperty('parentElement')).asElement()!;
    await (await parent.$('a'))!.click();
  }

  export async function getPeriodos(strategy: QAcademicoStrategy): Promise<PeriodoInfo[]> {
    await openSelect(strategy);
    const { page } = strategy;
    const form = (await page.$('#frmConsultar'))!;
    const options = (await form.$$('select option'))!;
    const periodos: PeriodoInfo[] = [];
    for (const option of options) {
      const codigo = await (await option.getProperty('value')).jsonValue();
      const nome = await (await option.getProperty('innerText')).jsonValue();
      if (!!nome.trim()) {
        periodos.push({ nome, codigo });
      }
    }
    return periodos;
  }

  export async function getPeriodo(strategy: QAcademicoStrategy, { codigo, nome }: PeriodoInfo): Promise<PeriodoCompleto> {
    await openSelect(strategy);
    const { page } = strategy;
    const form = (await page.$('#frmConsultar'))!;
    const select = (await form.$('#frmConsultar'))!;
    await page.evaluate(`(() => {
      const element = document.querySelector('#frmConsultar select');
      element.querySelector('option[value="${codigo}"]').selected = true;
    })()`);
    await (await form.$('[type=submit]'))!.click();
    await page.waitForNavigation();
    return {
      nome, codigo,
      disciplinas: await getDisciplinas(strategy)
    };
  }

}
