import { NumeroEtapa } from './../services/strategy/factory';
import { UUID } from './uuid';
import { DatabaseService } from './database';

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

  export async function findByDescricao(ud: number, descricao: string): Promise<NotaDto | null> {
    const connection = await DatabaseService.getDatabase();
    const [dto] = await connection.query(
      'SELECT * FROM nota WHERE usuario_disciplina=? AND descricao=? LIMIT 1',
      [ud, descricao]
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
    const dto = await NotaService.findByDescricao(nota.usuario_disciplina, nota.descricao);
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

}
