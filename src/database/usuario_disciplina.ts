import { UUID } from './uuid';
import { DatabaseService } from './database';

export interface UsuarioDisciplinaDto {
  id?: number;
  disciplina_professor: number;
  usuario: UUID;
  favorito?: boolean;
}

export namespace UsuarioDisciplinaService {

  function convert(dto: UsuarioDisciplinaDto): UsuarioDisciplinaDto {
    return dto && {
      ...dto,
      usuario: UUID.from(dto.usuario),
      favorito: !!dto.favorito
    };
  }

  export async function create(uddto: UsuarioDisciplinaDto): Promise<UsuarioDisciplinaDto> {
    const connection = await DatabaseService.getDatabase();
    const res = await connection.query(
      'INSERT INTO usuario_disciplina VALUES (?, ?, ?, ?)',
      [
        0, uddto.disciplina_professor, uddto.usuario.toString(), uddto.favorito ? 1 : 0
      ]
    );
    return convert({
      ...uddto,
      id: res.insertId
    });
  }

  export async function findById(id: number): Promise<UsuarioDisciplinaDto | null> {
    const connection = await DatabaseService.getDatabase();
    const [dto] = await connection.query(
      'SELECT * FROM usuario_disciplina WHERE id=? LIMIT 1',
      [id]
    );
    return convert(dto);
  }

  export async function find(uddto: UsuarioDisciplinaDto): Promise<UsuarioDisciplinaDto> {
    const connection = await DatabaseService.getDatabase();
    const [dto] = await connection.query(
      'SELECT * FROM usuario_disciplina WHERE disciplina_professor=? AND usuario=? LIMIT 1',
      [
        uddto.disciplina_professor, uddto.usuario.toString()
      ]
    );
    return convert(dto);
  }

  export async function isFavorite(usuario_disciplina: number): Promise<boolean> {
    const db = await DatabaseService.getDatabase();
    const [res] = await db.query(`
    SELECT favorito FROM usuario_disciplina
      WHERE usuario_disciplina.id = ?
      LIMIT 1;
    `, [usuario_disciplina]);
    return !!res.favorito;
  }

  export async function setFavorite(periodo: Date, disciplina: UUID, usuario: UUID, state: boolean): Promise<void> {
    const db = await DatabaseService.getDatabase();
    await db.query(`
    UPDATE usuario_disciplina
      LEFT JOIN disciplina_professor ON disciplina_professor.id = usuario_disciplina.disciplina_professor
      SET favorito = ?
      WHERE disciplina_professor.disciplina = ?
        AND disciplina_professor.periodo = ?
        AND usuario_disciplina.usuario = ?;
    `, [state ? 1 : 0, disciplina.toString(), periodo, usuario.toString()]);
  }

  export async function findOrCreate(nova: UsuarioDisciplinaDto): Promise<[boolean, UsuarioDisciplinaDto]> {
    const connection = await DatabaseService.getDatabase();
    const params = [
      0, nova.disciplina_professor, nova.usuario.toString(), nova.favorito ? 1 : 0,
      nova.disciplina_professor, nova.usuario.toString()
    ];
    const [insert, select] = await Promise.all([

      connection.query(
        `INSERT INTO usuario_disciplina
        SELECT * FROM (SELECT ?, ?, ?, ? AS fav) AS tmp
        WHERE NOT EXISTS (
          SELECT id FROM usuario_disciplina WHERE disciplina_professor=? AND usuario=?
        ) LIMIT 1;
        `, params),

      UsuarioDisciplinaService.find(nova)

    ]);
    if (!insert.affectedRows) {
      return [false, select!];
    }
    return [true, { ...nova, id: insert.insertId }];
  }

  export async function getPeriodos(usuario: UUID): Promise<{ periodo: Date }[]> {
    const db = await DatabaseService.getDatabase();
    const res = await db.query(`
    SELECT disciplina_professor.periodo FROM usuario_disciplina
      LEFT JOIN disciplina_professor ON disciplina_professor.id = usuario_disciplina.disciplina_professor
      WHERE usuario_disciplina.usuario = ?
      GROUP BY periodo;
    `, [usuario.toString()]);
    return res;
  }

  export async function getPeriodo(usuario: UUID, periodo: Date): Promise<{ periodo: Date } | null> {
    const db = await DatabaseService.getDatabase();
    const [res] = await db.query(`
    SELECT disciplina_professor.periodo FROM usuario_disciplina
      LEFT JOIN disciplina_professor ON disciplina_professor.id = usuario_disciplina.disciplina_professor
      WHERE usuario_disciplina.usuario = ?
        AND disciplina_professor.periodo = ?
      GROUP BY periodo
      LIMIT 1;
    `, [usuario.toString(), periodo]);
    return res;
  }

}
