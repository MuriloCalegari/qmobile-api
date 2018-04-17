import { DisciplinaDto } from './disciplina';
import { UUID } from './uuid';
import { DatabaseService } from './database';
import { UsuarioDto } from './usuario';
import * as moment from 'moment';

export interface DisciplinaDto {
  id?: UUID;
  nome: string;
  endpoint: UUID;
}

export interface DisciplinaExtras {
  ud: number;
}

export namespace DisciplinaService {

  function convert(dto: DisciplinaDto): DisciplinaDto {
    return dto && {
      ...dto,
      id: dto.id && UUID.from(dto.id),
      endpoint: UUID.from(dto.endpoint)
    };
  }

  export async function create(disciplina: DisciplinaDto): Promise<DisciplinaDto> {
    const connection = await DatabaseService.getDatabase();
    disciplina = {
      ...disciplina,
      id: UUID.random()
    };
    await connection.query(
      'INSERT INTO disciplina VALUES (?, ?, ?)',
      [disciplina.id!.toString(), disciplina.nome, disciplina.endpoint.toString()]
    );
    return convert(disciplina);
  }

  export async function findByNome(endpoint: UUID, nome: string): Promise<DisciplinaDto | null> {
    const connection = await DatabaseService.getDatabase();
    const [dto] = await connection.query(
      'SELECT * FROM disciplina WHERE nome=? AND endpoint=? LIMIT 1',
      [nome, endpoint.toString()]
    );
    return convert(dto);
  }

  export async function findOrCreate(disciplina: DisciplinaDto): Promise<[boolean, DisciplinaDto]> {
    const connection = await DatabaseService.getDatabase();
    const nova = {
      ...disciplina,
      id: UUID.random()
    };
    const [insert, select] = await Promise.all([

      connection.query(
        `INSERT INTO disciplina (id, nome, endpoint)
        SELECT * FROM (SELECT ?, ?, ?) AS tmp
        WHERE NOT EXISTS (
            SELECT nome FROM disciplina WHERE nome = ?
        ) LIMIT 1;
        `, [nova.id.toString(), nova.nome, nova.endpoint.toString(), nova.nome]),

      DisciplinaService.findByNome(disciplina.endpoint, disciplina.nome)

    ]);
    if (!insert.affectedRows) {
      return [false, select!];
    }
    return [true, nova];
  }

  export async function getDisciplinas(usuario: UsuarioDto, periodo: Date, nome?: string): Promise<(DisciplinaDto & DisciplinaExtras)[]> {
    const db = await DatabaseService.getDatabase();
    const res = await db.query(`
      SELECT disciplina.*, disciplina_professor.turma, usuario_disciplina.id AS ud FROM usuario_disciplina
        LEFT JOIN disciplina_professor ON usuario_disciplina.disciplina_professor = disciplina_professor.id
        LEFT JOIN disciplina ON disciplina.id = disciplina_professor.disciplina
        WHERE disciplina_professor.periodo = ?
            AND usuario_disciplina.usuario = ?
            ${!!nome ? 'AND disciplina.nome LIKE ?' : ''}
        GROUP BY id
        ORDER BY disciplina.nome DESC;
      `, [periodo, usuario.id!.toString(), nome && `%${nome}%`]);
    return res.map(dado => convert(dado));
  }

  export async function getDisciplina(usuario: UsuarioDto, periodo: Date, id: UUID): Promise<DisciplinaDto & DisciplinaExtras> {
    const db = await DatabaseService.getDatabase();
    const [res] = await db.query(`
      SELECT disciplina.*, disciplina_professor.turma, usuario_disciplina.id AS ud FROM usuario_disciplina
        LEFT JOIN disciplina_professor ON usuario_disciplina.disciplina_professor = disciplina_professor.id
        LEFT JOIN disciplina ON disciplina.id = disciplina_professor.disciplina
        WHERE disciplina_professor.periodo = ?
            AND disciplina_professor.disciplina = ?
            AND usuario_disciplina.usuario = ?
        LIMIT 1;
      `, [periodo, id.toString(), usuario.id!.toString()]);
    return convert(res) as any;
  }

  export async function getDisciplinaByNome(usuario: UsuarioDto, periodo: Date, nome: string): Promise<DisciplinaDto & DisciplinaExtras> {
    const db = await DatabaseService.getDatabase();
    const [res] = await db.query(`
      SELECT disciplina.*, disciplina_professor.turma, usuario_disciplina.id AS ud FROM usuario_disciplina
        LEFT JOIN disciplina_professor ON usuario_disciplina.disciplina_professor = disciplina_professor.id
        LEFT JOIN disciplina ON disciplina.id = disciplina_professor.disciplina
        WHERE disciplina_professor.periodo = ?
            AND disciplina.nome = ?
            AND usuario_disciplina.usuario = ?
        LIMIT 1;
      `, [moment(periodo).format('YYYY-MM-DD'), nome, usuario.id!.toString()]);
    return convert(res) as any;
  }

  export async function getDisciplinaByUD(usuario_disciplina: number): Promise<DisciplinaDto & { turma: string }> {
    const db = await DatabaseService.getDatabase();
    const [res] = await db.query(`
    SELECT disciplina.*, disciplina_professor.turma FROM usuario_disciplina
      LEFT JOIN disciplina_professor ON usuario_disciplina.disciplina_professor = disciplina_professor.id
      LEFT JOIN disciplina ON disciplina.id = disciplina_professor.disciplina
      WHERE usuario_disciplina.id = ?
      LIMIT 1;
    `, [usuario_disciplina]);
    return convert(res) as any;
  }

  export async function getFavorites(periodo: Date, usuario: UUID): Promise<(DisciplinaDto & DisciplinaExtras)[]> {
    const db = await DatabaseService.getDatabase();
    const res = await db.query(`
    SELECT disciplina.*, disciplina_professor.turma, usuario_disciplina.id AS ud FROM usuario_disciplina
        LEFT JOIN disciplina_professor ON usuario_disciplina.disciplina_professor = disciplina_professor.id
        LEFT JOIN disciplina ON disciplina.id = disciplina_professor.disciplina
        WHERE disciplina_professor.periodo = ?
            AND usuario_disciplina.usuario = ?
            AND usuario_disciplina.favorito = 1;
    `, [periodo, usuario.toString()]);
    return res.map(dto => convert(dto));
  }

}
