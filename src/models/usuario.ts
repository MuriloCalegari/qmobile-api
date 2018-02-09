import * as Sequelize from 'sequelize';
import * as orm from './orm';
import * as Disciplina from './disciplina';
import * as UsuarioDisciplina from './usuario_disciplina';

interface DBUser {
  id?: string;
  matricula?: string;
  nome?: string;
  password?: string;
  endpoint?: string;
}

interface DBUserInstance extends Sequelize.Instance<DBUser> { }

const Usuario = orm.define<DBUserInstance, DBUser>('user', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  matricula: {
    type: Sequelize.STRING,
    allowNull: false
  },
  nome: {
    type: Sequelize.STRING,
    allowNull: false
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  },
  endpoint: {
    type: Sequelize.STRING,
    allowNull: false
  }
});

Usuario.belongsToMany(Disciplina, { through: UsuarioDisciplina });
Disciplina.belongsToMany(Usuario, { through: UsuarioDisciplina });

export = Usuario;

