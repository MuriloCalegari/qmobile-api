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
  peso?: number | null;
  notamaxima?: number | null;
  nota?: number | null;
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
      'INSERT INTO nota VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        nota.id!.toString(), nota.usuario_disciplina, nota.descricao,
        nota.data, nota.etapa, nota.peso, nota.notamaxima, nota.nota
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

  export function getMedia(notaDto: NotaDto): number {
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

}
