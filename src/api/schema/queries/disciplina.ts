import { NotaDto, NotaService, HistoricoDto } from './../../../database/nota';
import { ProfessorDto, ProfessorService } from './../../../database/professor';
import { PeriodoContext } from './../index';
import { DisciplinaDto } from './../../../database/disciplina';
import { DatabaseService } from '../../../database/database';
import { UUID } from '../../../database/uuid';
import { UsuarioDisciplinaService } from '../../../database/usuario_disciplina';
import * as moment from 'moment';

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
    media(etapa: NumeroEtapa): Float!
    professor: Professor!
    notas: [Nota!]!
    historico: [Historico!]!
  }
  `,

  resolvers: {

    Disciplina: {
      async professor({ context, id }: DisciplinaDto & PeriodoContext, _, c): Promise<ProfessorDto> {
        return await ProfessorService.getProfessor(context.periodo, UUID.from(id!));
      },
      async notas({ context, id }: DisciplinaDto & PeriodoContext, _, c): Promise<(NotaDto & PeriodoContext)[]> {
        const res = await NotaService.getNotas(context.usuario.id!, id!, context.periodo);
        return res.map(dado => ({
          ...dado,
          context
        }));
      },
      async historico({ context, id }: DisciplinaDto & PeriodoContext, _, c): Promise<HistoricoDto[]> {
        const historico = await NotaService.getHistorico(context.usuario.id!, id!, context.periodo);
        return historico.map(hist => ({
          ...hist,
          media: Math.round(hist.media * 100) / 100,
          data: moment(hist.data).format('DD/MM/YYYY')
        }));
      },
      media({ context, id }: DisciplinaDto & PeriodoContext, { etapa }, c): Promise<number> {
        return NotaService.getMediaDisciplina(context.usuario.id!, id!, context.periodo, etapa);
      },
      favorito({ context, id }: DisciplinaDto & PeriodoContext, _, c): Promise<boolean> {
        return UsuarioDisciplinaService.isFavorite(context.periodo, id!, context.usuario.id!);
      }
    }

  }

};
