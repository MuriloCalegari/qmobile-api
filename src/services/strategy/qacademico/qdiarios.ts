import { QAcademicoStrategy } from './index';
import * as cheerio from 'cheerio';
import { DIARIOS_PAGE } from '../../../constants';
import {
  RemoteNota,
  RemoteEtapa,
  RemoteDisciplina,
  NumeroEtapa,
  RemoteTurma
} from '../factory';

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
          return { turma, nome, professor: professor || '', etapas };
        }

      }).filter(d => !!d) as RemoteDisciplina[];

      return disciplinas;
    } catch (e) {
      await strategy.release(true);
      throw new Error(e);
    }
  }

  export async function getTurmas(strategy: QAcademicoStrategy): Promise<RemoteTurma[]> {
    const disciplinas = await getDisciplinas(strategy);
    const names = disciplinas.reduce((arr, { turma }) => {
      if (!arr.includes(turma)) {
        arr.push(turma);
      }
      return arr;
    }, [] as string[]);
    return names.map(nome => ({
      nome,
      disciplinas: disciplinas
        .filter(({ turma }) => turma === nome)
    }));
  }

}
