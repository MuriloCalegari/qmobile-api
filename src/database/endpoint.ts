import { UUID } from './uuid';
import { DatabaseService } from './database';
import { URL } from 'url';

export interface EndpointDto {
  id?: UUID;
  nome: string;
  url: string;
}

export namespace EndpointService {

  function convert(dto: EndpointDto): EndpointDto {
    return dto && {
      ...dto,
      id: dto.id && UUID.from(dto.id)
    };
  }

  export async function create(url: string): Promise<EndpointDto> {
    const id = UUID.random();
    const connection = await DatabaseService.getDatabase();
    const endpoint: EndpointDto = {
      url,
      nome: EndpointService.getNameByUrl(url),
      id
    };
    await connection.query(
      'INSERT INTO endpoint VALUES(?, ?, ?)',
      [endpoint.id!.toString(), endpoint.nome, endpoint.url]
    );
    return convert(endpoint);
  }

  export async function getEndpointByUrl(url: string): Promise<EndpointDto | null> {
    const connection = await DatabaseService.getDatabase();
    const [dto] = await connection.query('SELECT * FROM endpoint WHERE url=? LIMIT 1', [url]);
    return convert(dto);
  }

  export async function getEndpointById(id: UUID): Promise<EndpointDto | null> {
    const connection = await DatabaseService.getDatabase();
    const [dto] = await connection.query('SELECT * FROM endpoint WHERE id=? LIMIT 1', [id.toString()]);
    return convert(dto);
  }

  export async function findOrCreate(url: string): Promise<[boolean, EndpointDto]> {
    const dto = await EndpointService.getEndpointByUrl(url);
    if (!dto) {
      return [true, await EndpointService.create(url)];
    }
    return [false, convert(dto)];
  }

  export function getNameByUrl(endpoint_url: string): string {
    const url = new URL(endpoint_url);
    return url.hostname;
  }

}
