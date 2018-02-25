import { Usuario } from './usuario';
import {
  Table,
  Column,
  Model,
  PrimaryKey,
  IsUUID,
  AllowNull,
  BelongsTo,
  DataType,
  ForeignKey,
  Default,
  Sequelize
} from 'sequelize-typescript';

@Table({
  modelName: 'session'
})
export class Session extends Model<Session> {

  @IsUUID(4)
  @Default(Sequelize.UUIDV4)
  @PrimaryKey
  @Column
  id: string;

  @AllowNull(false)
  @Default(Sequelize.NOW)
  @Column(DataType.DATE)
  startdate: Date;

  @Column
  instanceid: string;

  @ForeignKey(() => Usuario)
  @Column
  usuarioId: string;

  @BelongsTo(() => Usuario, { foreignKey: 'usuarioId' })
  usuario: Usuario;

}
