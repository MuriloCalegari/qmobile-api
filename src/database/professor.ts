import { UUID } from './uuid';
import { DatabaseService } from './database';

export interface ProfessorDto {
  id?: UUID;
  nome: string;
  endpoint: UUID;
}

export namespace ProfessorService {

  function convert(dto: ProfessorDto): ProfessorDto {
    return dto && {
      ...dto,
      id: dto.id && UUID.from(dto.id),
      endpoint: UUID.from(dto.endpoint)
    };
  }

  export async function create(professor: ProfessorDto): Promise<ProfessorDto> {
    const connection = await DatabaseService.getDatabase();
    professor = {
      ...professor,
      id: UUID.random()
    };
    await connection.query(
      'INSERT INTO professor VALUES (?, ?, ?)',
      [professor.id!.toString(), professor.nome, professor.endpoint.toString()]
    );
    return convert(professor);
  }

  export async function findByNome(endpoint: UUID, nome: string): Promise<ProfessorDto | null> {
    const connection = await DatabaseService.getDatabase();
    const [dto] = await connection.query(
      'SELECT * FROM professor WHERE nome=? AND endpoint=? LIMIT 1',
      [nome, endpoint.toString()]
    );
    return convert(dto);
  }

  export async function findOrCreate(professor: ProfessorDto): Promise<[boolean, ProfessorDto]> {
    const connection = await DatabaseService.getDatabase();
    const novo = {
      ...professor,
      id: UUID.random()
    };
    const [insert, select] = await Promise.all([

      connection.query(
      `INSERT INTO professor
      SELECT * FROM (SELECT ?, ?, ?) AS tmp
      WHERE NOT EXISTS (
        SELECT id FROM professor WHERE nome=? AND endpoint=?
      ) LIMIT 1;
      `, [
        novo.id!.toString(), novo.nome, novo.endpoint.toString(),
        novo.nome, novo.endpoint.toString()
      ]),

      ProfessorService.findByNome(professor.endpoint, professor.nome)

    ]);
    if (!insert.affectedRows) {
      return [false, select!];
    }
    return [true, novo];
  }

  export async function getProfessor(periodo: Date, disciplina: UUID): Promise<ProfessorDto> {
    const db = await DatabaseService.getDatabase();
    const [res] = await db.query(`
    SELECT professor.* FROM disciplina_professor
      LEFT JOIN professor ON professor.id = disciplina_professor.professor
      WHERE disciplina_professor.periodo = ?
        AND disciplina_professor.disciplina = ?
      LIMIT 1;
    `, [periodo, disciplina.toString()]);
    return convert(res);
  }

}
