import {
  Table,
  Model
} from 'sequelize-typescript';

@Table({
  modelName: 'usuario_disciplina'
})
export class UsuarioDisciplina extends Model<UsuarioDisciplina> {

}
