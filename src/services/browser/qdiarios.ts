import { QBrowser } from './../driver/qbrowser';
import { QDisciplina } from './qdiarios';
import * as webdriver from '../driver/webdriver';
import * as cheerio from 'cheerio';
import { DIARIOS_PAGE } from '../../constants';

export async function openDiarios(browser: QBrowser): Promise<void> {
  try {
    const driver = browser.getDriver();
    const diarios = browser.getEndpoint() + DIARIOS_PAGE;
    const url = await driver.getCurrentUrl();
    if (url !== diarios) {
      await driver.get(diarios);
    }
    await driver.wait(async () => {
      const readyState = await driver.executeScript('return document.readyState');
      return readyState === 'complete';
    });
  } catch (e) {
    await browser.exit(true);
    throw e;
  }
}

export enum NumeroEtapa {
  ETAPA1 = 1,
  ETAPA2 = 2,
  RP_ETAPA1 = 3,
  RP_ETAPA2 = 4
}

export interface QDisciplina {
  id?: string;
  turma: string;
  nome: string;
  professor: string;
  etapas: QEtapa[];
}

export interface QEtapa {
  numero: NumeroEtapa;
  notas: QNota[];
}

export interface QNota {
  [key: string]: any;
  id?: string;
  descricao: string;
  peso: number;
  notamaxima: number;
  nota: number;
}

function extractFloat(val: string): number {
  return parseFloat(val.replace(/[^0-9\.]/g, '')) || -1;
}

function extractInt(val: string): number {
  return parseInt(val.replace(/[^0-9]/g, ''), 10);
}

function readNota(dom: CheerioStatic, preelem: CheerioElement): QNota {
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

function readEtapa(dom: CheerioStatic, preelem: CheerioElement): QEtapa | null {
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

export async function getDisciplinas(browser: QBrowser): Promise<QDisciplina[]> {
  try {
    const driver = browser.getDriver();
    await openDiarios(browser);
    const dom = cheerio.load(await driver.getPageSource());
    const tabelaNotas = dom(
      `table tr:nth-child(2) > td > table tr:nth-child(2) > td:nth-child(2) >
        table:nth-child(3) > tbody td:nth-child(2) table:nth-child(3) > tbody`
    );
    const trs = tabelaNotas.children('tr').toArray();

    const disciplinas: QDisciplina[] = trs.map((elem, i) => {

      const tr = dom(elem);
      if (!tr.hasClass('conteudoTexto') && !tr.hasClass('rotulo')) {
        const descricao = tr.find('td.conteudoTexto').text();
        const [_, turma, nome, professor] = descricao.split('-')
          .map(p => p && p.trim().replace(/\([a-zA-Z0-9]+\)/g, ''));
        const etapas: QEtapa[] = [];
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
        return { turma, nome, professor, etapas };
      }

    }).filter(d => !!d) as QDisciplina[];

    return disciplinas;
  } catch (e) {
    await browser.exit(true);
    throw new Error(e);
  }
}
