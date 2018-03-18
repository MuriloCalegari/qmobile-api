import { NotaDto } from './../../../database/nota';
import { ProfessorDto } from './../../../database/professor';
import { PeriodoContext } from './../index';
import { DisciplinaDto } from './../../../database/disciplina';
import { DatabaseService } from '../../../database/database';

export = {

  schema: `
  type Professor {
    id: ID!
    nome: String!
  }
  type Disciplina {
    id: ID!
    nome: String!
    turma: String!
    professor: Professor!
    notas: [Nota!]!
  }
  `,

  resolvers: {

    Disciplina: {
      async professor({ context, id }: DisciplinaDto & PeriodoContext, _, c): Promise<ProfessorDto[]> {
        const db = await DatabaseService.getDatabase();
        const [res] = await db.query(`
        SELECT professor.* FROM disciplina_professor
          LEFT JOIN professor ON professor.id = disciplina_professor.professor
          WHERE disciplina_professor.periodo = ?
            AND disciplina_professor.disciplina = ?
          LIMIT 1;
        `, [context.periodo, id!.toString()]);
        return res;
      },
      async notas({ context, id }: DisciplinaDto & PeriodoContext, _, c): Promise<(NotaDto & PeriodoContext)[]> {
        const db = await DatabaseService.getDatabase();
        const res = await db.query(`
        SELECT nota.* FROM nota
          LEFT JOIN usuario_disciplina ON nota.usuario_disciplina = usuario_disciplina.id
          LEFT JOIN disciplina_professor ON disciplina_professor.id = usuario_disciplina.disciplina_professor
          WHERE disciplina_professor.disciplina = ?
              AND disciplina_professor.periodo = ?
          ORDER BY
            nota.data DESC,
            nota.descricao DESC,
            nota.etapa DESC;
        `, [id!.toString(), context.periodo]);
        return res.map(dado => ({
          ...dado,
          context
        }));
      }
    }

  }

};
