import { UUID } from './../../../database/uuid';
import { BaseContext } from './../index';
import { UsuarioDto, UsuarioService } from './../../../database/usuario';
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
    session(id: ID!): UserMutation
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
      },
      async session(_, { id }, c): Promise<(UsuarioDto & BaseContext) | null> {
        try {
          const session = await SessionService.findById(UUID.from(id));
          if (!session) {
            throw new Error('Sessão inválida');
          }
          const usuario = (await UsuarioService.findById(session.usuario))!;
          await HistoryLoader.load(usuario.id!.toString());
          return usuario && {
            ...usuario,
            context: {
              usuario,
              session
            }
          };
        } catch {
          return null;
        }
      },
    }

  },

};
