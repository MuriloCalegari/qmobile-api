import { Turma } from './../../models/turma';
import { Disciplina } from './../../models/disciplina';
import { Usuario } from './../../models/usuario';
import { makeExecutableSchema } from 'graphql-tools';
import { IResolvers } from 'graphql-tools/dist/Interfaces';
import { Session } from '../../models/session';

export interface DisciplinaContext {
  user: Usuario;
  disciplina: Disciplina;
}

export interface TurmaContext {
  user: Usuario;
  turma: Turma;
}

interface GType {
  schema: string;
  resolvers: IResolvers;
}

const types: GType[] = [
  require('./mutations/mutation'),
  require('./queries/disciplina'),
  require('./queries/turma'),
  require('./queries/user'),
  require('./queries/query')
];

const schm = types.map((type) => type.schema).join('\n');
const resolvers = Object.assign.apply(Object, [{}, ...types.map((type) => type.resolvers)]);

export const schema = makeExecutableSchema({
  typeDefs: schm,
  resolvers
});
