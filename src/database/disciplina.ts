import { UUID } from './uuid';
import { DatabaseService } from './database';

export interface DisciplinaDto {
  id?: UUID;
  nome: string;
  endpoint: UUID;
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
    const dto = await DisciplinaService.findByNome(disciplina.endpoint, disciplina.nome);
    if (!dto) {
      return [true, await DisciplinaService.create(disciplina)];
    }
    return [false, dto];
  }

}
