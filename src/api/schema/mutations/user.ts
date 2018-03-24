import { UUID } from './../../../database/uuid';
import { BaseContext } from './../index';
import * as auth from '../../../services/auth/authenticate';
import { SessionService } from '../../../database/session';
import { UsuarioDisciplinaService } from '../../../database/usuario_disciplina';
import * as moment from 'moment';


export = {

  schema: `

  type UserMutation {
    setFavorite(periodo: ID!, disciplina: ID!, state: Boolean!): Boolean!
  }
  `,

  resolvers: {

    UserMutation: {
      async setFavorite({ context }: BaseContext, { periodo, disciplina, state }, c): Promise<boolean> {
        const date = moment(periodo, 'YYYY/M');
        if (!date.isValid()) {
          return false;
        }
        await UsuarioDisciplinaService.setFavorite(
          date.toDate(),
          UUID.from(disciplina),
          context.usuario.id!,
          state
        );
        return true;
      }
    }

  },

};
