import * as Sequelize from 'sequelize';
import * as orm from './orm';
import * as Disciplina from './disciplina';
import * as Usuario from './usuario';

interface DBNota {
  id?: string;
  etapa?: number;
  descricao?: string;
  peso?: number;
  notamaxima?: number;
  nota?: number;
  disciplinaid?: string;
  userid?: string;
}

interface DBNotaInstance extends Sequelize.Instance<DBNota> { }

const Nota = orm.define<DBNotaInstance, DBNota>('nota', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  etapa: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  descricao: {
    type: Sequelize.STRING,
    allowNull: false
  },
  peso: {
    type: Sequelize.FLOAT
  },
  notamaxima: {
    type: Sequelize.FLOAT
  },
  nota: {
    type: Sequelize.FLOAT
  }
});

Disciplina.hasMany(Nota, { foreignKey: 'disciplinaid' });
Usuario.hasMany(Nota, { foreignKey: 'userid' })

export = Nota;
