import { EndpointDto } from './../../../database/endpoint';
import { UsuarioDto } from './../../../database/usuario';
import { BaseContext } from './../index';
import { UUID } from './../../../database/uuid';
import { SessionService } from '../../../database/session';
import { UsuarioService } from '../../../database/usuario';
import { EndpointService } from '../../../database/endpoint';

export = {

  schema: `type Query {
    session(id: ID!): User
    endpoints: [Endpoint!]!
  }`,

  resolvers: {

    Query: {
      async session(_, { id }, c): Promise<(UsuarioDto & BaseContext) | null> {
        try {
          const session = await SessionService.findById(UUID.from(id));
          if (!session) {
            throw new Error('Sessão inválida');
          }
          const usuario = (await UsuarioService.findById(session.usuario))!;
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
      endpoints(_, q, c): Promise<EndpointDto[]> {
        return EndpointService.findAll();
      }
    }

  }

};
