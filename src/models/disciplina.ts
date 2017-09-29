import * as Sequelize from 'sequelize';
import * as orm from './orm';

const disciplina = orm.define('disciplina', {
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

export = disciplina;