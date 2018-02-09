import { Nota } from './nota';
import { Disciplina } from './disciplina';
import { UsuarioDisciplina } from './usuario_disciplina';

import {
  Table,
  Column,
  Model,
  HasMany,
  PrimaryKey,
  IsUUID,
  AllowNull,
  BelongsToMany
} from 'sequelize-typescript';

@Table({
  modelName: 'user'
})
export class Usuario extends Model<Usuario> {

  @IsUUID(4)
  @PrimaryKey
  @Column
  id: string;

  @AllowNull(false)
  @Column
  matricula: string;

  @AllowNull(false)
  @Column
  nome: string;

  @AllowNull(false)
  @Column
  password: string;

  @AllowNull(false)
  @Column
  endpoint: string;

  @BelongsToMany(() => Disciplina, () => UsuarioDisciplina)
  disciplinas: Disciplina[];

  @HasMany(() => Nota, { foreignKey: 'userid' })
  notas: Nota[]

}
