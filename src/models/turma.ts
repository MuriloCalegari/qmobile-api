import { Disciplina } from './disciplina';
import {
  Table,
  Column,
  Model,
  HasMany,
  PrimaryKey
} from 'sequelize-typescript';

@Table({
  modelName: 'turma'
})
export class Turma extends Model<Turma> {

  @Column
  @PrimaryKey
  codigo: string;

  @Column
  nome: string;

  @HasMany(() => Disciplina, { foreignKey: 'turma' })
  disciplinas: Disciplina[];

}
