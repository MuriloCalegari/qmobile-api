import { NotaDto } from './../../../database/nota';
import { ProfessorDto } from './../../../database/professor';
import { PeriodoContext } from './../index';
import { DisciplinaDto } from './../../../database/disciplina';
import { DatabaseService } from '../../../database/database';

import * as moment from 'moment';

export = {

  schema: `
  enum NumeroEtapa {
    ETAPA1
    ETAPA2
    RP_ETAPA1
    RP_ETAPA2
  }

  type Nota {
    id: ID!
    descricao: String!
    data: String!
    etapa: NumeroEtapa!
    media: Float!
    peso: Float
    nota: Float
    notamaxima: Float
  }
  `,

  resolvers: {

    NumeroEtapa: {
      ETAPA1: 1,
      ETAPA2: 2,
      RP_ETAPA1: 3,
      RP_ETAPA2: 4
    },

    Nota: {
      media(notaDto: NotaDto & PeriodoContext, _, c): number {
        const nota = Math.max(0, notaDto.nota as any);
        if (nota <= 0) {
          return Number(notaDto.nota);
        }
        const notaMaxima = Math.max(0, notaDto.notamaxima as any);
        let maximo = Math.max(notaDto.peso as any, notaMaxima);
        if (maximo <= 0 || nota > maximo) {
          maximo = 10;
        }
        return (nota / maximo) * 10;
      },
      data(notaDto: NotaDto & PeriodoContext, _, c): string {
        return moment(notaDto.data).format('DD/MM/YYYY');
      }
    }

  }

};
