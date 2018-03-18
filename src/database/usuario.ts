import { UUID } from './uuid';
import { EndpointService } from './endpoint';
import { DatabaseService } from './database';

export interface UsuarioDto {
  id?: UUID;
  matricula: string;
  nome: string;
  password: string;
  endpoint: UUID;
  inicializado?: boolean;
}

export namespace UsuarioService {

  function convert(dto: UsuarioDto): UsuarioDto {
    return dto && {
      ...dto,
      id: dto.id && UUID.from(dto.id),
      endpoint: UUID.from(dto.endpoint),
      inicializado: !!dto.inicializado
    };
  }

  export async function create(usuario: UsuarioDto): Promise<UsuarioDto> {
    const connection = await DatabaseService.getDatabase();

    usuario = {
      ...usuario,
      id: UUID.random()
    };
    await connection.query(
      'INSERT INTO usuario VALUES (?, ?, ?, ?, ?, ?)',
      [
        usuario.id!.toString(), usuario.nome, usuario.matricula,
        usuario.password, Number(!!usuario.inicializado), usuario.endpoint.toString()
      ]
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

  export async function findById(id: UUID): Promise<UsuarioDto | null> {
    const connection = await DatabaseService.getDatabase();
    const [dto] = await connection.query(
      'SELECT * FROM usuario WHERE id=? LIMIT 1',
      [id.toString()]
    );
    return convert(dto);
  }

  export async function findOrCreate(usuario: UsuarioDto): Promise<[boolean, UsuarioDto]> {
    const dto = await UsuarioService.findByMatricula(usuario.matricula);
    if (!dto) {
      return [true, await UsuarioService.create(usuario)];
    }
    return [false, convert(dto)];
  }

  export async function findAll(): Promise<UsuarioDto[]> {
    const connection = await DatabaseService.getDatabase();
    const res: UsuarioDto[] = await connection.query('SELECT * FROM usuario');
    return res.map(dto => convert(dto));
  }

  export async function setInicializado(id: UUID, state: boolean): Promise<void> {
    const connection = await DatabaseService.getDatabase();
    await connection.query(
      'UPDATE usuario SET inicializado=? WHERE id=?',
      [Number(state), id.toString()]
    );
  }

}
