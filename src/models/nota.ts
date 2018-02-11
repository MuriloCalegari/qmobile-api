import { Usuario } from './usuario';
import { Disciplina } from './disciplina';
import {
  Table,
  Column,
  Model,
  PrimaryKey,
  IsUUID,
  AllowNull,
  DataType,
  ForeignKey,
  BelongsTo
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

  @BelongsTo(() => Disciplina, { foreignKey: 'disciplinaid' })
  disciplina: Disciplina;

  @ForeignKey(() => Disciplina)
  @Column
  disciplinaid: string;

  @BelongsTo(() => Usuario, { foreignKey: 'userid' })
  user: Usuario;

  @ForeignKey(() => Usuario)
  @Column
  userid: string;

}
