import * as Sequelize from 'sequelize';
import * as orm from './orm';
import * as Turma from './turma';

const Disciplina = orm.define('disciplina', {
    id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
    },
    nome: {
        type: Sequelize.STRING,
        allowNull: false
    },
    professor: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

Turma.hasMany(Disciplina, { foreignKey: 'codturma' });

export = Disciplina;