import { Usuario } from './usuario';
import {
  Table,
  Column,
  Model,
  PrimaryKey,
  IsUUID,
  AllowNull,
  BelongsTo
} from 'sequelize-typescript';

@Table({
  modelName: 'session'
})
export class Session extends Model<Session> {

  @IsUUID(4)
  @PrimaryKey
  @Column
  id: string;

  @AllowNull(false)
  @Column
  startdate: Date;

  @Column
  instanceid: string;

  @BelongsTo(() => Usuario, { foreignKey: 'usuario' })
  usuario: Usuario;

}
