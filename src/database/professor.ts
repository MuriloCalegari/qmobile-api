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
    const dto = await ProfessorService.findByNome(professor.endpoint, professor.nome);
    if (!dto) {
      return [true, await ProfessorService.create(professor)];
    }
    return [false, dto];
  }

}
