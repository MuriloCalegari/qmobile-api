import { NotaDto, NotaService } from './../../../database/nota';
import { PeriodoContext, DisciplinaResponse } from './../index';
import { DisciplinaDto, DisciplinaService } from './../../../database/disciplina';
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
    disciplina: Disciplina!
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
      data(notaDto: NotaDto & PeriodoContext, _, c): string {
        return moment(notaDto.data).format('DD/MM/YYYY');
      },
      async disciplina({ context, usuario_disciplina }: NotaDto & PeriodoContext, _, c
      ): Promise<DisciplinaResponse & PeriodoContext> {
        const res = await DisciplinaService.getDisciplinaByUD(usuario_disciplina);
        return res && {
          ...res,
          ud: usuario_disciplina,
          context
        } as any;
      },
    }

  }

};
