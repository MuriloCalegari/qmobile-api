import { UUID } from './uuid';
import * as moment from 'moment';
import { DatabaseService } from './database';

export interface DisciplinaProfessorDto {
  id?: number;
  periodo: Date;
  turma: string;
  disciplina: UUID;
  professor: UUID;
}

export namespace DisciplinaProfessorService {

  function convert(dto: DisciplinaProfessorDto): DisciplinaProfessorDto {
    return dto && {
      ...dto,
      disciplina: UUID.from(dto.disciplina),
      professor: UUID.from(dto.professor)
    };
  }

  export async function find(dpdto: DisciplinaProfessorDto): Promise<DisciplinaProfessorDto | null> {
    const connection = await DatabaseService.getDatabase();
    const [dto] = await connection.query(
      'SELECT * FROM disciplina_professor WHERE periodo=? AND turma=? AND disciplina=? AND professor=? LIMIT 1',
      [
        moment(dpdto.periodo).format('YYYY-MM-DD'), dpdto.turma,
        dpdto.disciplina.toString(), dpdto.professor.toString()
      ]
    );
    return convert(dto);
  }

  export async function findOrCreate(nova: DisciplinaProfessorDto): Promise<[boolean, DisciplinaProfessorDto]> {
    const connection = await DatabaseService.getDatabase();
    const params = [
      moment(nova.periodo).format('YYYY-MM-DD'),
      nova.turma,
      nova.disciplina.toString(),
      nova.professor.toString()
    ];
    const [insert, select] = await Promise.all([

      connection.query(
        `INSERT INTO disciplina_professor (id, periodo, turma, disciplina, professor)
        SELECT * FROM (SELECT ?, ?, ?, ?, ?) AS tmp
        WHERE NOT EXISTS (
          SELECT professor FROM disciplina_professor WHERE periodo=? AND turma=? AND disciplina=? AND professor=?
        ) LIMIT 1;
        `, [0, ...params, ...params]),

      DisciplinaProfessorService.find(nova)

    ]);
    if (!insert.affectedRows) {
      return [false, select!];
    }
    return [true, { ...nova, id: insert.insertId }];
  }

}
