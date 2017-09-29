import * as Sequelize from 'sequelize';
import * as orm from './orm';
import * as Disciplina from './disciplina';

const Nota = orm.define('nota', {
    id: {
        type: Sequelize.UUIDV4,
        primaryKey: true
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

Nota.belongsTo(Disciplina, { foreignKey: 'disciplinaid' });

export = Nota;