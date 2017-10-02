import * as Sequelize from 'sequelize';
import * as orm from './orm';
import * as Turma from './turma';

const Disciplina = orm.define('disciplina', {
    id: {
        type: Sequelize.UUIDV4,
        primaryKey: true
    },
    turma: {
        type: Sequelize.STRING,
        allowNull: false
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

Disciplina.belongsTo(Turma, { foreignKey: 'codturma' });

export = Disciplina;