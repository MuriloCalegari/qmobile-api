import { Usuario } from './../../../models/usuario';
import { Session } from './../../../models/session';
import * as auth from '../../../services/auth/authenticate';

interface LoginInput {
  endpoint: string;
  matricula: string;
  password: string;
  instance?: string;
}

export = {

  schema: `
  input LoginInput {
    endpoint: String!
    matricula: String!
    password: String!
    instance: String
  }

  type Mutation {
    login(input: LoginInput!): String!
  }
  `,

  resolvers: {

    Mutation: {
      async login(_, { input }: { input: LoginInput }, c): Promise<string> {
        const { endpoint, matricula, password, instance } = input;
        const user = await auth.login(endpoint, matricula, password);
        const session = await Session.create({
          instanceid: instance,
          usuarioId: user.id
        });
        return session.id;
      }
    }

  }

};
