import { DatabaseService } from './database';
import * as uuid from 'uuid/v4';
import { URL } from 'url';

export interface EndpointDto {
  id?: string;
  nome: string;
  url: string;
}

export namespace EndpointService {

  export async function create(url: string): Promise<EndpointDto> {
    const id = uuid();
    const connection = await DatabaseService.getDatabase();
    const endpoint: EndpointDto = {
      url,
      nome: EndpointService.getNameByUrl(url),
      id
    };
    await connection.query(
      'INSERT INTO endpoint VALUES(?, ?, ?)',
      [endpoint.id, endpoint.nome, endpoint.url]
    );
    return endpoint;
  }

  export async function getEndpointByUrl(url: string): Promise<EndpointDto | null> {
    const connection = await DatabaseService.getDatabase();
    const [dto] = await connection.query('SELECT * FROM endpoint WHERE url=?', [url]);
    return dto;
  }

  export async function getEndpointById(id: string): Promise<EndpointDto | null> {
    const connection = await DatabaseService.getDatabase();
    const [dto] = await connection.query('SELECT * FROM endpoint WHERE id=?', [id]);
    return dto;
  }

  export async function findOrCreate(url: string): Promise<EndpointDto> {
    const dto = await EndpointService.getEndpointByUrl(url);
    if (!dto) {
      return EndpointService.create(url);
    }
    return dto;
  }

  export function getNameByUrl(endpoint_url: string): string {
    const url = new URL(endpoint_url);
    return url.hostname;
  }

}
