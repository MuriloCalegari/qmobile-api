import * as Sequelize from 'sequelize';
import * as orm from './orm';
import * as Disciplina from './disciplina';
import * as Usuario from './usuario';

const Nota = orm.define('nota', {
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