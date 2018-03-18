import { EndpointDto, EndpointService } from './../../../database/endpoint';
import { BaseContext, PeriodoContext } from './../index';
import * as moment from 'moment';
import { DatabaseService } from '../../../database/database';

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
  }
  `,

  resolvers: {

    User: {
      async endpoint({ context: { usuario } }: BaseContext, _, c): Promise<EndpointDto> {
        return (await EndpointService.getEndpointById(usuario.endpoint))!;
      },
      async periodos({ context }: BaseContext, _, c): Promise<(PeriodoContext & { nome: string })[]> {
        const db = await DatabaseService.getDatabase();
        const res = await db.query(`
        SELECT disciplina_professor.periodo FROM usuario_disciplina
          LEFT JOIN disciplina_professor ON disciplina_professor.id = usuario_disciplina.disciplina_professor
          WHERE usuario_disciplina.usuario = ?
          GROUP BY periodo;
        `, [context.usuario.id!.toString()]);
        return res.map(dado => ({
          nome: moment(dado.periodo).format('YYYY/M'),
          context: {
            ...context,
            periodo: dado.periodo
          }
        }));
      },
      async periodo({ context }: BaseContext, { nome }, c): Promise<(PeriodoContext & { nome: string }) | null> {
        const date = moment(nome, 'YYYY/M');
        if (!date.isValid()) {
          return null;
        }
        const db = await DatabaseService.getDatabase();
        const [res] = await db.query(`
        SELECT disciplina_professor.periodo FROM usuario_disciplina
          LEFT JOIN disciplina_professor ON disciplina_professor.id = usuario_disciplina.disciplina_professor
          WHERE usuario_disciplina.usuario = ?
            AND disciplina_professor.periodo = ?
          GROUP BY periodo
          LIMIT 1;
        `, [context.usuario.id!.toString(), date.toDate()]);
        if (!res) {
          return null;
        }
        return res && {
          nome: moment(res.periodo).format('YYYY/M'),
          context: {
            ...context,
            periodo: res.periodo
          }
        };
      }
    }

  }

};
