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
    nota.media = NotaService.getMedia(nota);
    await connection.query(
      'INSERT INTO nota VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        nota.id!.toString(), nota.usuario_disciplina, nota.descricao,
        nota.data, nota.etapa, nota.media, nota.peso, nota.notamaxima, nota.nota
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
    const media = NotaService.getMedia(nota);
    await connection.query(
      'UPDATE nota SET media=?, nota=?, peso=?, notamaxima=? WHERE id=?',
      [media, nota.nota, nota.peso, nota.notamaxima, id.toString()]
    );
  }

  export async function findOrCreate(nota: NotaDto): Promise<[boolean, NotaDto]> {
    const dto = await NotaService.find(nota);
    if (!dto) {
      return [true, await NotaService.create(nota)];
    }
    return [false, dto];
  }

  export async function findById(id: UUID): Promise<NotaDto | null> {
    const connection = await DatabaseService.getDatabase();
    const [dto] = await connection.query(
      'SELECT * FROM disciplina WHERE id=? LIMIT 1',
      [id.toString()]
    );
    return convert(dto);
  }

  export function getMedia(notaDto: NotaUpdate | NotaDto): number {
    const nota = Math.max(0, notaDto.nota as any);
    if (nota <= 0) {
      return Number(notaDto.nota);
    }
    const notaMaxima = Math.max(0, notaDto.notamaxima as any);
    let maximo = Math.max(notaDto.peso as any, notaMaxima);
    if (maximo <= 0 || nota > maximo) {
      maximo = 10;
    }
    const media = (nota / maximo) * 10;
    return Math.round(media * 100) / 100;
  }

  export async function getHistorico(usuario: UUID, disciplina: UUID, periodo: Date): Promise<HistoricoDto[]> {
    const db = await DatabaseService.getDatabase();
    const res = await db.query(`
    SELECT nota.data, AVG(nota.media) AS media, nota.etapa FROM nota
      LEFT JOIN usuario_disciplina ON nota.usuario_disciplina = usuario_disciplina.id
      LEFT JOIN disciplina_professor ON disciplina_professor.id = usuario_disciplina.disciplina_professor
      WHERE disciplina_professor.disciplina = ?
        AND disciplina_professor.periodo = ?
        AND usuario_disciplina.usuario = ?
        AND nota.media >= 0
      GROUP BY nota.data
      ORDER BY nota.data DESC;
    `, [disciplina.toString(), periodo, usuario.toString()]);
    return res;
  }

  export async function getNotas(usuario: UUID, disciplina: UUID, periodo: Date): Promise<NotaDto[]> {
    const db = await DatabaseService.getDatabase();
    const res = await db.query(`
    SELECT nota.* FROM nota
      LEFT JOIN usuario_disciplina ON nota.usuario_disciplina = usuario_disciplina.id
      LEFT JOIN disciplina_professor ON disciplina_professor.id = usuario_disciplina.disciplina_professor
      WHERE disciplina_professor.disciplina = ?
        AND disciplina_professor.periodo = ?
        AND usuario_disciplina.usuario = ?
      ORDER BY
        nota.data DESC,
        nota.descricao DESC,
        nota.etapa DESC;
    `, [disciplina.toString(), periodo, usuario.toString()]);
    return res.map(dado => convert(dado));
  }

  export async function getMediaDisciplina(usuario: UUID, disciplina: UUID, periodo: Date, etapa?: NumeroEtapa): Promise<number> {
    const db = await DatabaseService.getDatabase();
    const [res] = await db.query(`
    SELECT AVG(nota.media) AS media FROM nota
      LEFT JOIN usuario_disciplina ON nota.usuario_disciplina = usuario_disciplina.id
      LEFT JOIN disciplina_professor ON disciplina_professor.id = usuario_disciplina.disciplina_professor
      WHERE disciplina_professor.disciplina = ?
        AND disciplina_professor.periodo = ?
        AND nota.media >= 0
        AND usuario_disciplina.usuario = ?
        ${!!etapa ? 'AND nota.etapa = ?' : ''}
    `, [disciplina.toString(), periodo, usuario.toString(), etapa]);
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
