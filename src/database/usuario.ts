import { EndpointService } from './endpoint';
import { DatabaseService } from './database';
import * as uuid from 'uuid/v4';

export interface UsuarioDto {
  id?: string;
  matricula: string;
  nome: string;
  password: string;
}

export namespace UsuarioService {

  type UsuarioEndpoint = UsuarioDto & { endpoint: string };

  export async function create({ endpoint, ...usuario }: UsuarioEndpoint): Promise<UsuarioDto> {
    const connection = await DatabaseService.getDatabase();
    const endpointDto = await await EndpointService.findOrCreate(endpoint);

    usuario = {
      ...usuario,
      id: uuid()
    };
    await connection.query(
      'INSERT INTO usuario VALUES (?, ?, ?, ?, ?)',
      [usuario.id, usuario.nome, usuario.matricula, usuario.password, endpointDto.id]
    );
    return usuario;
  }

  export async function findByMatricula(matricula: string): Promise<UsuarioDto | null> {
    const connection = await DatabaseService.getDatabase();
    const [dto] = await connection.query(
      'SELECT * FROM usuario WHERE matricula=? LIMIT 1',
      [matricula]
    );
    return dto;
  }

  export async function findOrCreate(usuario: UsuarioEndpoint): Promise<UsuarioDto> {
    const dto = await UsuarioService.findByMatricula(usuario.matricula);
    if (!dto) {
      return UsuarioService.create(usuario);
    }
    return dto;
  }

}
