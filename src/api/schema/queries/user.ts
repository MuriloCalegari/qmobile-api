import { HistoryLoader } from './../loader';
import { EndpointDto, EndpointService } from './../../../database/endpoint';
import { BaseContext, PeriodoContext } from './../index';
import * as moment from 'moment';
import { DatabaseService } from '../../../database/database';
import { NotaDto, NotaService } from '../../../database/nota';
import { UsuarioDisciplinaService } from '../../../database/usuario_disciplina';
import { UUID } from '../../../database/uuid';

export = {

  schema: `
  type Endpoint {
    id: ID!
    nome: String!
    url: String!
  }
  type User {
    id: ID!
    matricula: String!
    nome: String!
    endpoint: Endpoint!
    periodos: [Periodo!]!
    periodo(nome: String!): Periodo
    nota(id: ID!): Nota
  }
  `,

  resolvers: {

    User: {
      async endpoint({ context: { usuario } }: BaseContext, _, c): Promise<EndpointDto> {
        return (await EndpointService.getEndpointById(usuario.endpoint))!;
      },
      async periodos({ context }: BaseContext, _, c): Promise<(PeriodoContext & { nome: string })[]> {
        await HistoryLoader.load(context.usuario.id!.toString());
        const res = await UsuarioDisciplinaService.getPeriodos(context.usuario.id!);
        return res.map(dado => ({
          nome: moment(dado.periodo).format('YYYY/M'),
          context: {
            ...context,
            periodo: dado.periodo
          }
        }));
      },
      async periodo({ context }: BaseContext, { nome }, c): Promise<(PeriodoContext & { nome: string }) | null> {
        await HistoryLoader.load(context.usuario.id!.toString());
        const date = moment(nome, 'YYYY/M');
        if (!date.isValid()) {
          return null;
        }
        const res = await UsuarioDisciplinaService.getPeriodo(context.usuario.id!, date.toDate());
        if (!res) {
          return null;
        }
        return {
          nome: moment(res.periodo).format('YYYY/M'),
          context: {
            ...context,
            periodo: res.periodo
          }
        };
      },
      async nota({ context }: BaseContext, { id }, _): Promise<(NotaDto & PeriodoContext) | null> {
        await HistoryLoader.load(context.usuario.id!.toString());
        if (typeof id !== 'string' || id.length !== 36) {
          return null;
        }
        const res = await NotaService.getNota(context.usuario.id!, UUID.from(id));
        if (!res) {
          return null;
        }
        const { periodo, ...nota } = res;
        return {
          context: {
            ...context,
            periodo
          },
          ...nota
        };
      }
    }

  }

};
