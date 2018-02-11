import { Usuario } from './usuario';
import { Disciplina } from './disciplina';
import {
  Table,
  Column,
  Model,
  PrimaryKey,
  IsUUID,
  AllowNull,
  BelongsTo,
  DataType
} from 'sequelize-typescript';

@Table({
  modelName: 'nota'
})
export class Nota extends Model<Nota> {

  @IsUUID(4)
  @PrimaryKey
  @Column
  id: string;

  @AllowNull(false)
  @Column
  etapa: number;

  @AllowNull(false)
  @Column
  descricao: string;

  @Column(DataType.FLOAT)
  peso: number;

  @Column(DataType.FLOAT)
  notamaxima: number;

  @Column(DataType.FLOAT)
  nota: number;

  @BelongsTo(() => Disciplina)
  disciplinaid: Disciplina;

  @BelongsTo(() => Usuario)
  userid: Usuario;

}
