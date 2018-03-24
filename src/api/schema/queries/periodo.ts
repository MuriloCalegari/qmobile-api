import { DisciplinaDto, DisciplinaService } from './../../../database/disciplina';
import { PeriodoContext } from './../index';
import { UUID } from '../../../database/uuid';

export = {

  schema: `type Periodo {
    nome: ID!
    disciplinas(nome: String): [Disciplina!]!
    favoritos: [Disciplina!]!
    disciplina(id: ID!): Disciplina
  }`,

  resolvers: {

    Periodo: {
      async disciplinas({ context }: PeriodoContext, { nome }, c): Promise<(DisciplinaDto & PeriodoContext)[]> {
        const disciplinas = await DisciplinaService.getDisciplinas(context.usuario, context.periodo, nome);
        return disciplinas.map(dado => ({
          ...dado,
          context
        }));
      },
      async favoritos({ context }: PeriodoContext, _, c): Promise<(DisciplinaDto & PeriodoContext)[]> {
        const disciplinas = await DisciplinaService.getFavorites(context.periodo, context.usuario.id!);
        return disciplinas.map(dado => ({
          ...dado,
          context
        }));
      },
      async disciplina({ context }: PeriodoContext, { id }, c): Promise<(DisciplinaDto & PeriodoContext) | null> {
        if (typeof id !== 'string' || id.length !== 36) {
          return null;
        }
        const res = await DisciplinaService.getDisciplina(context.usuario, context.periodo, UUID.from(id));
        return res && {
          ...res,
          context
        };
      }
    }

  }

};
