import { NumeroEtapa } from './../services/strategy/factory';
import { UUID } from './uuid';
import { DatabaseService } from './database';
import * as moment from 'moment';

export interface NotaUpdate {
  peso: number;
  notamaxima: number;
  nota: number;
}

export interface NotaDto {
  id?: UUID;
  usuario_disciplina: number;
  descricao: string;
  data: Date;
  etapa: NumeroEtapa;
  media?: number;
  peso?: number | null;
  notamaxima?: number | null;
  nota?: number | null;
}

export interface HistoricoDto {
  data: string;
  media: number;
  etapa: NumeroEtapa;
}

export namespace NotaService {

  function convert(dto: NotaDto): NotaDto {
    return dto && {
      ...dto,
      id: dto.id && UUID.from(dto.id)
    };
  }

  export async function create(nota: NotaDto): Promise<NotaDto> {
    const connection = await DatabaseService.getDatabase();
    nota = {
      ...nota,
      id: UUID.random()
    };
    await connection.query(
      'INSERT INTO nota VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        nota.id!.toString(), nota.usuario_disciplina, nota.descricao,
        nota.data, nota.etapa, null, nota.peso, nota.notamaxima, nota.nota
      ]
    );
    return convert(nota);
  }

  export async function find(nota: NotaDto): Promise<NotaDto | null> {
    const connection = await DatabaseService.getDatabase();
    const [dto] = await connection.query(
      'SELECT * FROM nota WHERE usuario_disciplina=? AND descricao=? AND etapa=? AND data=? LIMIT 1',
      [nota.usuario_disciplina, nota.descricao, nota.etapa, moment(nota.data).format('YYYY-MM-DD')]
    );
    return convert(dto);
  }

  export async function update(id: UUID, nota: NotaUpdate): Promise<void> {
    const connection = await DatabaseService.getDatabase();
    await connection.query(
      'UPDATE nota SET nota=?, peso=?, notamaxima=? WHERE id=?',
      [nota.nota, nota.peso, nota.notamaxima, id.toString()]
    );
  }

  export async function findOrCreate(nota: NotaDto): Promise<[boolean, NotaDto]> {
    const nova = {
      ...nota,
      id: UUID.random()
    };
    const insertParams = [
      nova.id!.toString(), nova.usuario_disciplina, nova.descricao,
      moment(nova.data).format('YYYY-MM-DD'), nova.etapa, null, nova.peso, nova.notamaxima, nova.nota
    ];
    const queryParams = [
      nova.usuario_disciplina, nova.descricao, nova.etapa, moment(nova.data).format('YYYY-MM-DD')
    ];
    const connection = await DatabaseService.getDatabase();

    const cols = insertParams.map((_, i) => `? AS col_${i}`).join(', ');
    const [insert, select] = await Promise.all([

      connection.query(
        `INSERT INTO nota
        SELECT * FROM (SELECT ${cols}) AS tmp
        WHERE NOT EXISTS (
          SELECT id FROM nota WHERE usuario_disciplina=? AND descricao=? AND etapa=? AND data=?
        ) LIMIT 1;
        `, [...insertParams, ...queryParams]),

      NotaService.find(nova)

    ]);
    if (!insert.affectedRows) {
      return [false, select!];
    }
    return [true, nova];
  }

  export async function findById(id: UUID): Promise<NotaDto | null> {
    const connection = await DatabaseService.getDatabase();
    const [dto] = await connection.query(
      'SELECT * FROM disciplina WHERE id=? LIMIT 1',
      [id.toString()]
    );
    return convert(dto);
  }

  export async function getHistorico(usuario_disciplina: number): Promise<HistoricoDto[]> {
    const db = await DatabaseService.getDatabase();
    const res = await db.query(`
    SELECT nota.data, AVG(nota.media) AS media, nota.etapa FROM nota
      WHERE nota.usuario_disciplina = ?
        AND nota.media >= 0
      GROUP BY nota.data
      ORDER BY nota.data DESC;
    `, [usuario_disciplina]);
    return res;
  }

  export async function getNotas(usuario_disciplina: number): Promise<NotaDto[]> {
    const db = await DatabaseService.getDatabase();
    const res = await db.query(`
    SELECT nota.* FROM nota
      WHERE nota.usuario_disciplina = ?
      ORDER BY
        nota.data DESC,
        nota.descricao DESC,
        nota.etapa DESC;
    `, [usuario_disciplina]);
    return res.map(dado => convert(dado));
  }

  export async function getMediaDisciplina(usuario_disciplina: number, etapa?: NumeroEtapa): Promise<number> {
    const db = await DatabaseService.getDatabase();
    const [res] = await db.query(`
    SELECT AVG(nota.media) AS media FROM nota
      WHERE nota.usuario_disciplina = ?
        AND nota.media >= 0
        ${!!etapa ? 'AND nota.etapa = ?' : ''}
    `, [usuario_disciplina, etapa]);
    return Math.round(res.media * 100) / 100;
  }

  export async function getNota(usuario: UUID, id: UUID): Promise<(NotaDto & { periodo: Date }) | null> {
    const db = await DatabaseService.getDatabase();
    const [res] = await db.query(`
    SELECT nota.*, disciplina_professor.periodo FROM nota
      LEFT JOIN usuario_disciplina ON nota.usuario_disciplina = usuario_disciplina.id
      LEFT JOIN disciplina_professor ON disciplina_professor.id = usuario_disciplina.disciplina_professor
        WHERE nota.id = ?
        AND usuario_disciplina.usuario = ?
        LIMIT 1;
    `, [id.toString(), usuario.toString()]);
    return convert(res) as any;
  }

}
