import { HistoryLoader } from './../loader';
import * as auth from '../../../services/auth/authenticate';
import { SessionService } from '../../../database/session';

interface LoginInput {
  endpoint: string;
  matricula: string;
  password: string;
  instance?: string;
}

interface LoginResult {
  novo: boolean;
  session: string;
}

export = {

  schema: `
  type LoginResult {
    novo: Boolean!
    session: String!
  }

  input LoginInput {
    endpoint: String!
    matricula: String!
    password: String!
    instance: String
  }

  type Mutation {
    login(input: LoginInput!): LoginResult!
  }
  `,

  resolvers: {

    Mutation: {
      async login(_, { input }: { input: LoginInput }, c): Promise<LoginResult> {
        const { endpoint, matricula, password, instance } = input;
        const user = await auth.login(endpoint, matricula, password);
        HistoryLoader.load(user.id!.toString());
        const session = await SessionService.create({
          usuario: user.id!,
          instance: input.instance
        });
        return {
          novo: !user.inicializado,
          session: session.id!.toString()
        };
      }
    }

  },

};
