import { NotaDto, NotaService } from './../../../database/nota';
import { ProfessorDto, ProfessorService } from './../../../database/professor';
import { PeriodoContext } from './../index';
import { DisciplinaDto } from './../../../database/disciplina';
import { DatabaseService } from '../../../database/database';
import { UUID } from '../../../database/uuid';

export = {

  schema: `
  type Professor {
    id: ID!
    nome: String!
  }
  type Disciplina {
    id: ID!
    nome: String!
    turma: String!
    media(etapa: NumeroEtapa): Float!
    professor: Professor!
    notas: [Nota!]!
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
      media({ context, id }: DisciplinaDto & PeriodoContext, { etapa }, c): Promise<number> {
        return NotaService.getMediaDisciplina(context.usuario.id!, id!, context.periodo, etapa);
      }
    }

  }

};
