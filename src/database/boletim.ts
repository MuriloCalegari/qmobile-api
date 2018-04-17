import { DatabaseService } from './database';

export interface BoletimDto {
  id?: number;
  usuario_disciplina: number;
  situacao: 'Aprovado' | 'Reprovado' | 'Cursando';
  etapa1: number;
  etapa2: number;
  rp_etapa1?: number;
  rp_etapa2?: number;
}

export namespace BoletimService {

  export async function upsert(dto: BoletimDto): Promise<[boolean, BoletimDto]> {
    const connection = await DatabaseService.getDatabase();
    const [insert, select] = await Promise.all([

      connection.query(
      `INSERT INTO boletim
      SELECT * FROM (SELECT ? AS id, ? AS ud, ? AS s, ? AS e1, ? AS e2, ? AS r1, ? AS r2) AS tmp
      WHERE NOT EXISTS (
        SELECT id FROM boletim WHERE usuario_disciplina=?
      ) LIMIT 1;
      `, [
        0, dto.usuario_disciplina, dto.situacao, dto.etapa1, dto.etapa2, dto.rp_etapa1, dto.rp_etapa2,
        dto.usuario_disciplina
      ]),

      BoletimService.findByUD(dto.usuario_disciplina)

    ]);
    if (!insert.affectedRows) {
      await BoletimService.update(select.id!, dto);
      return [false, select!];
    }
    return [true, { ...dto, id: insert.insertId }];
  }

  export async function update(ud: number, dto: BoletimDto): Promise<void> {
    const connection = await DatabaseService.getDatabase();
    await connection.query(
      'UPDATE boletim SET situacao=?, etapa1=?, etapa2=?, rp_etapa1=?, rp_etapa2=? WHERE usuario_disciplina=?',
      [dto.situacao, dto.etapa1, dto.etapa2, dto.rp_etapa1, dto.rp_etapa2, ud]
    );
  }

  export async function findByUD(ud: number): Promise<BoletimDto> {
    const connection = await DatabaseService.getDatabase();
    const [res] = await connection.query(
      'SELECT * FROM boletim WHERE usuario_disciplina=?',
      [ud]
    );
    return res;
  }

}
