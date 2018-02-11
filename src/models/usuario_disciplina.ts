import { Disciplina } from './disciplina';
import { Usuario } from './usuario';
import {
  Table,
  Model,
  ForeignKey,
  Column
} from 'sequelize-typescript';

@Table({
  modelName: 'usuario_disciplina'
})
export class UsuarioDisciplina extends Model<UsuarioDisciplina> {

  @ForeignKey(() => Usuario)
  @Column
  usuario: string;

  @ForeignKey(() => Disciplina)
  @Column
  disciplina: string;

}
