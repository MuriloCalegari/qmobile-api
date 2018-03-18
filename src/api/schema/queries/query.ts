import { UsuarioDto } from './../../../database/usuario';
import { BaseContext } from './../index';
import { UUID } from './../../../database/uuid';
import { SessionService } from '../../../database/session';
import { UsuarioService } from '../../../database/usuario';
import { NotasTask } from '../../../tasks/notas';
import { EndpointService } from '../../../database/endpoint';
import { StrategyFactory } from '../../../services/strategy/factory';

export = {

  schema: `type Query {
    session(id: ID!): User
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
          if (!usuario.inicializado) {
            const [endpoint] = await Promise.all([
              EndpointService.getEndpointById(usuario.endpoint),
              UsuarioService.setInicializado(usuario.id!, true)
            ]);

            const strategy = (await StrategyFactory.prepareStrategy(endpoint!, usuario))!;
            await NotasTask.updateRemote(strategy, usuario.matricula, true);
          }
          return usuario && {
            ...usuario,
            context: {
              usuario,
              session
            }
          };
        } catch (e) {
          return null;
        }
      }
    }

  }

};
