import { Turma } from './turma';
import { Nota } from './nota';
import { Usuario } from './usuario';
import { UsuarioDisciplina } from './usuario_disciplina';

import {
  Table,
  Column,
  Model,
  HasMany,
  PrimaryKey,
  IsUUID,
  AllowNull,
  BelongsToMany,
  BelongsTo
} from 'sequelize-typescript';

@Table({
  modelName: 'disciplina'
})
export class Disciplina extends Model<Disciplina> {

  @IsUUID(4)
  @PrimaryKey
  @Column
  id: string;

  @AllowNull(false)
  @Column
  nome: string;

  @AllowNull(false)
  @Column
  professor: string;

  @BelongsToMany(() => Usuario, () => UsuarioDisciplina)
  usuarios: Usuario[];

  @HasMany(() => Nota, { foreignKey: 'disciplina' })
  notas: Nota[];

  @BelongsTo(() => Turma, 'turma')
  turma: Turma;

}
