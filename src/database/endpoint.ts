import { StrategyType } from './../services/strategy/factory';
import { UUID } from './uuid';
import { DatabaseService } from './database';
import { URL } from 'url';

export interface EndpointDto {
  id?: UUID;
  nome: string;
  url: string;
  strategy: StrategyType;
}

export namespace EndpointService {

  function convert(dto: EndpointDto): EndpointDto {
    return dto && {
      ...dto,
      id: dto.id && UUID.from(dto.id)
    };
  }

  export async function create(url: string, strategy?: StrategyType): Promise<EndpointDto> {
    const id = UUID.random();
    const connection = await DatabaseService.getDatabase();
    const endpoint: EndpointDto = {
      url,
      nome: EndpointService.getNameByUrl(url),
      id,
      strategy: strategy || StrategyType.QACADEMICO
    };
    await connection.query(
      'INSERT INTO endpoint VALUES(?, ?, ?, ?)',
      [endpoint.id!.toString(), endpoint.nome, endpoint.url, endpoint.strategy]
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

  export async function findOrCreate(url: string, strategy?: StrategyType): Promise<[boolean, EndpointDto]> {
    const dto = await EndpointService.getEndpointByUrl(url);
    if (!dto) {
      return [true, await EndpointService.create(url, strategy)];
    }
    return [false, convert(dto)];
  }

  export async function findAll(): Promise<EndpointDto[]> {
    const connection = await DatabaseService.getDatabase();
    const dtos = await connection.query('SELECT * FROM endpoint');
    return dtos.map(dto => convert(dto));
  }

  export function getNameByUrl(endpoint_url: string): string {
    const url = new URL(endpoint_url);
    return url.hostname;
  }

}
