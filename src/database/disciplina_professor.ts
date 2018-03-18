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

  export async function create({ id: _, ...dpdto }: DisciplinaProfessorDto): Promise<DisciplinaProfessorDto> {
    const connection = await DatabaseService.getDatabase();
    const res = await connection.query(
      'INSERT INTO disciplina_professor VALUES (?, ?, ?, ?, ?)',
      [
        0, dpdto.periodo, dpdto.turma,
        dpdto.disciplina.toString(), dpdto.professor.toString()
      ]
    );
    return convert({
      ...dpdto,
      id: res.insertId
    });
  }

  export async function findById(id: number): Promise<DisciplinaProfessorDto | null> {
    const connection = await DatabaseService.getDatabase();
    const [dto] = await connection.query(
      'SELECT * FROM disciplina_professor WHERE id=? LIMIT 1',
      [id]
    );
    return convert(dto);
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

  export async function findOrCreate(dpdto: DisciplinaProfessorDto): Promise<[boolean, DisciplinaProfessorDto]> {
    const connection = await DatabaseService.getDatabase();
    const dto = await DisciplinaProfessorService.find(dpdto);
    if (!dto) {
      return [true, await DisciplinaProfessorService.create(dpdto)];
    }
    return [false, dto];
  }

}
