import { UUID } from './uuid';
import { EndpointService } from './endpoint';
import { DatabaseService } from './database';

export interface UsuarioDto {
  id?: UUID;
  matricula: string;
  nome: string;
  password: string;
  endpoint: UUID;
}

export namespace UsuarioService {

  function convert(dto: UsuarioDto): UsuarioDto {
    return dto && {
      ...dto,
      id: dto.id && UUID.from(dto.id),
      endpoint: UUID.from(dto.endpoint),
    };
  }

  export async function create(usuario: UsuarioDto): Promise<UsuarioDto> {
    const connection = await DatabaseService.getDatabase();

    usuario = {
      ...usuario,
      id: UUID.random()
    };
    await connection.query(
      'INSERT INTO usuario VALUES (?, ?, ?, ?, ?)',
      [usuario.id, usuario.nome, usuario.matricula, usuario.password, usuario.endpoint.toString()]
    );
    return convert(usuario);
  }

  export async function findByMatricula(matricula: string): Promise<UsuarioDto | null> {
    const connection = await DatabaseService.getDatabase();
    const [dto] = await connection.query(
      'SELECT * FROM usuario WHERE matricula=? LIMIT 1',
      [matricula]
    );
    return convert(dto);
  }

  export async function findOrCreate(usuario: UsuarioDto): Promise<UsuarioDto> {
    const dto = await UsuarioService.findByMatricula(usuario.matricula);
    if (!dto) {
      return UsuarioService.create(usuario);
    }
    return convert(dto);
  }

}
