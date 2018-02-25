import { DisciplinaContext } from './../index';
import { Usuario } from './../../../models/usuario';
import { Session } from './../../../models/session';
export = {

  schema: `type Disciplina {
    id: ID!
    nome: String!
    professor: String!
  }`,

  resolvers: {

    Disciplina: {
      id({ disciplina }: DisciplinaContext, a, c) {
        return disciplina.id;
      },
      nome({ disciplina }: DisciplinaContext, a, c) {
        return disciplina.nome;
      },
      professor({ disciplina }: DisciplinaContext, a, c) {
        return disciplina.professor;
      }
    }

  }

};
