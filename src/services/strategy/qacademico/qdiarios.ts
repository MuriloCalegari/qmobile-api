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


export namespace QDiarios {

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

    let desc = descricao
      .replace(/\([a-zA-Z0-9]+\)/g, '')
      .replace(/\s\s+/g, ' ')
      .trim();

    let data: moment.Moment | null = moment(desc, 'DD/MM/YYYY');
    if (data.isValid() && data.isBefore(moment())) {
      desc = desc.substring(12).trim();
    } else {
      data = moment();
    }

    return {
      descricao: desc,
      data: data.toDate(),
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

  function getDisciplinas(content: string): RemoteDisciplina[] {
    const dom = cheerio.load(content, { decodeEntities: false });
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

    }).filter(d => !!d && !(!d.professor && d.etapas.length === 0)) as any;

    return disciplinas;
  }

  export async function getPeriodos(strategy: QAcademicoStrategy): Promise<PeriodoInfo[]> {
    const { endpoint } = strategy;
    const content = await strategy.getUrl(endpoint + DIARIOS_PAGE);

    const dom = cheerio.load(content, { decodeEntities: false });
    const opts = dom('#frmConsultar select option');
    const periodos: PeriodoInfo[] = opts
      .toArray()
      .map(elem => ({
        nome: dom(elem).text().trim(),
        codigo: elem.attribs.value
      })).filter(per => !!per.nome);

    return periodos;
  }

  export async function getPeriodo(strategy: QAcademicoStrategy, { codigo, nome }: PeriodoInfo): Promise<PeriodoCompleto> {
    try {
      const { endpoint, options } = strategy;
      const content = await strategy.postUrl(endpoint + DIARIOS_PAGE, {
        ANO_PERIODO2: codigo
      });
      return {
        nome, codigo,
        disciplinas: getDisciplinas(content)
      };
    } catch (e) {
      strategy.release(true);
      throw e;
    }
  }

}
