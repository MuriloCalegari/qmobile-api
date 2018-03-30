import { DisciplinaDto, DisciplinaExtras } from './../../database/disciplina';
import { SessionDto } from './../../database/session';
import { UsuarioDto } from './../../database/usuario';
import { makeExecutableSchema } from 'graphql-tools';
import { IResolvers } from 'graphql-tools/dist/Interfaces';

export interface BaseContext {
  context: {
    usuario: UsuarioDto;
    session: SessionDto;
  };
}

export type PeriodoContext = BaseContext & {
  context: {
    periodo: Date;
  }
};

export type DisciplinaResponse = DisciplinaDto & DisciplinaExtras;

interface GType {
  schema: string;
  resolvers: IResolvers;
}

const types: GType[] = [
  require('./mutations/user'),
  require('./mutations/mutation'),
  require('./queries/disciplina'),
  require('./queries/nota'),
  require('./queries/periodo'),
  require('./queries/user'),
  require('./queries/query')
];

const schm = types.map((type) => type.schema).join('\n');
const resolvers = Object.assign.apply(Object, [{}, ...types.map((type) => type.resolvers)]);

export const schema = makeExecutableSchema({
  typeDefs: schm,
  resolvers
});
