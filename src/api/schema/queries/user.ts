import { Turma } from './../../../models/turma';
import { Disciplina } from './../../../models/disciplina';
import { TurmaContext } from './../index';
import { Usuario } from './../../../models/usuario';
import { uniqBy } from 'lodash';

export = {

  schema: `type User {
    id: ID!
    nome: String!
    matricula: String!
    endpoint: String!
    turmas: [Turma!]!
  }`,

  resolvers: {

    User: {
      async turmas(user: Usuario, a, c): Promise<TurmaContext[]> {
        const disciplinas = await user.$get('disciplinas') as Disciplina[];
        const turmas = await Promise.all(
          disciplinas.map(async disciplina =>
            await disciplina.$get('turma') as Turma
          )
        );
        return uniqBy(turmas, turma => turma.id)
          .map(turma => ({
            turma, user
          }));
      }
    }

  }

};
