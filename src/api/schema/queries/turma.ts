import { Disciplina } from './../../../models/disciplina';
import { TurmaContext, DisciplinaContext } from './../index';
import { Turma } from '../../../models/turma';
export = {

  schema: `type Turma {
    id: ID!
    nome: String!
    disciplinas: [Disciplina!]!
  }`,

  resolvers: {

    Turma: {
      id({ turma }: TurmaContext, _, c) {
        return turma.codigo;
      },
      nome({ turma }: TurmaContext, _, c) {
        return turma.nome;
      },
      async disciplinas({ turma, user }: TurmaContext, _, c): Promise<DisciplinaContext[] | null> {
        const disciplinas = await user.$get('disciplinas', { where: { turmaId: turma.codigo }}) as Disciplina[];
        return disciplinas.map(disciplina => ({
          disciplina, user
        }));
      }
    }

  }

};
