import * as auth from '../../../services/auth/authenticate';
import { SessionService } from '../../../database/session';

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
        const id = await SessionService.createSession({
          usuario: user._id!,
          instance_id: instance
        });
        return id.toHexString();
      }
    }

  }

};
