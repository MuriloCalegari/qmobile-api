import { DisciplinaExtras } from './../../../database/disciplina';
import { BoletimDto } from './../../../database/boletim';
import { NotaDto, NotaService, HistoricoDto } from './../../../database/nota';
import { ProfessorDto, ProfessorService } from './../../../database/professor';
import { PeriodoContext, DisciplinaResponse } from './../index';
import { DatabaseService } from '../../../database/database';
import { UUID } from '../../../database/uuid';
import { UsuarioDisciplinaService } from '../../../database/usuario_disciplina';
import * as moment from 'moment';
import { BoletimService } from '../../../database/boletim';

export = {

  schema: `
  type Professor {
    id: ID!
    nome: String!
  }

  type Historico {
    data: String!
    media: Float!
    etapa: NumeroEtapa!
  }

  type Disciplina {
    id: ID!
    nome: String!
    turma: String!
    favorito: Boolean!
    boletim: Boletim!
    professor: Professor!
    notas: [Nota!]!
    historico: [Historico!]!
  }
  `,

  resolvers: {

    Disciplina: {
      async professor({ context, id }: DisciplinaResponse & PeriodoContext, _, c): Promise<ProfessorDto> {
        return await ProfessorService.getProfessor(context.periodo, UUID.from(id!));
      },
      async notas({ context, id, ud }: DisciplinaResponse & PeriodoContext, _, c): Promise<(NotaDto & PeriodoContext)[]> {
        const res = await NotaService.getNotas(ud);
        return res.map(dado => ({
          ...dado,
          context
        }));
      },
      async historico({ context, id, ud }: DisciplinaResponse & PeriodoContext, _, c): Promise<HistoricoDto[]> {
        const historico = await NotaService.getHistorico(ud);
        return historico.map(hist => ({
          ...hist,
          media: Math.round(hist.media * 100) / 100,
          data: moment(hist.data).format('DD/MM/YYYY')
        }));
      },
      favorito({ context, id, ud }: DisciplinaResponse & PeriodoContext, _, c): Promise<boolean> {
        return UsuarioDisciplinaService.isFavorite(ud);
      },
      async boletim({ context, id, ud, nome }: DisciplinaResponse & PeriodoContext, _, c): Promise<BoletimDto & DisciplinaExtras> {
        const boletim = (await BoletimService.findByUD(ud));
        return {
          ...boletim,
          ud
        };
      }
    }

  }

};
