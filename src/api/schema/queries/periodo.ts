import { DisciplinaDto } from './../../../database/disciplina';
import { PeriodoContext } from './../index';
import { DatabaseService } from '../../../database/database';
import * as moment from 'moment';

export = {

  schema: `type Periodo {
    nome: ID!
    disciplinas(nome: String): [Disciplina!]!
  }`,

  resolvers: {

    Periodo: {
      async disciplinas({ context }: PeriodoContext, { nome }, c
      ): Promise<(DisciplinaDto & PeriodoContext)[]> {
        const db = await DatabaseService.getDatabase();
        const res = await db.query(`
        SELECT disciplina.*, disciplina_professor.turma FROM usuario_disciplina
          LEFT JOIN disciplina_professor ON usuario_disciplina.disciplina_professor = disciplina_professor.id
          LEFT JOIN disciplina ON disciplina.id = disciplina_professor.disciplina
          WHERE disciplina_professor.periodo = ?
              AND usuario_disciplina.usuario = ?
              ${!!nome ? 'AND disciplina.nome LIKE ?' : ''}
          GROUP BY id;
        `, [context.periodo, context.usuario.id!.toString(), nome && `%${nome}%`]);
        return res.map(dado => ({
          ...dado,
          context
        }));
      },
    }

  }

};
