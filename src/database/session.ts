import { UUID } from './uuid';
import { DatabaseService } from './database';

export interface SessionDto {
  id?: UUID;
  usuario: UUID;
  instance?: string;
}

export namespace SessionService {

  function convert(dto: SessionDto): SessionDto {
    return dto && {
      ...dto,
      id: dto.id && UUID.from(dto.id),
      usuario: UUID.from(dto.usuario),
    };
  }

  export async function create(session: SessionDto): Promise<SessionDto> {
    const connection = await DatabaseService.getDatabase();

    session = {
      ...session,
      id: UUID.random()
    };
    await connection.query(
      'INSERT INTO session VALUES (?, ?, ?)',
      [session.id!.toString(), session.usuario.toString(), session.instance]
    );
    return convert(session);
  }

  export async function findById(id: UUID): Promise<SessionDto | null> {
    const connection = await DatabaseService.getDatabase();
    const [dto] = await connection.query(
      'SELECT * FROM session WHERE id=? LIMIT 1',
      [id.toString()]
    );
    return convert(dto);
  }

}
