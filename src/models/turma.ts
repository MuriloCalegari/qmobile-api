import * as Sequelize from 'sequelize';
import * as orm from './orm';

const Turma = orm.define('turma', {
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