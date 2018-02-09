import * as Sequelize from 'sequelize';
import * as orm from './orm';

interface DBTurma {
  codigo?: string;
  nome?: string;
}

interface DBTurmaInstance extends Sequelize.Instance<DBTurma> { }

const Turma = orm.define<DBTurmaInstance, DBTurma>('turma', {
  codigo: {
    type: Sequelize.STRING,
    primaryKey: true
  },
  nome: {
    type: Sequelize.STRING,
    allowNull: false
  },
});

export = Turma;
