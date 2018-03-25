import { PeriodoInfo, PeriodoCompleto, RemoteNota, NumeroEtapa } from './../factory';
import { QAcademicoStrategy } from './../qacademico/index';
import * as _ from 'lodash';

export class QAcademicoV2Strategy extends QAcademicoStrategy {

  constructor(endpoint: string) {
    super(endpoint);
  }

  async getPeriodo(info: PeriodoInfo): Promise<PeriodoCompleto> {
    const periodo = await super.getPeriodo(info);
    periodo.disciplinas.forEach(disciplina => {
      const { etapas } = disciplina;
      const notas = etapas
        .reduce((ac, etapa) => ac.concat(etapa.notas), [] as RemoteNota[])
        .map(nota => {
          let etapa: NumeroEtapa;
          if (nota.descricao.includes('N2')) {
            if (nota.descricao.toLowerCase().includes('substitutiva')) {
              etapa = NumeroEtapa.RP_ETAPA2;
            } else {
              etapa = NumeroEtapa.ETAPA2;
            }
          } else {
            if (nota.descricao.toLowerCase().includes('substitutiva')) {
              etapa = NumeroEtapa.RP_ETAPA1;
            } else {
              etapa = NumeroEtapa.ETAPA1;
            }
          }
          return {
            ...nota,
            etapa
          };
        });
      const pre = _.groupBy(notas, 'etapa');
      disciplina.etapas = Object.keys(pre).map(key => ({
        numero: parseInt(key, 10),
        notas: pre[key].map(({ etapa, ...nota }) => nota)
      }));
    });
    return periodo;
  }

}
