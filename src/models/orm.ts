import { Disciplina } from './disciplina';
import { Usuario } from './usuario';
import { Turma } from './turma';
import { Nota } from './nota';
import { UsuarioDisciplina } from './usuario_disciplina';
import { Session } from './session';

import * as configs from '../configs';
import { Sequelize } from 'sequelize-typescript';

const test = process.env && process.env.NODE_ENV === 'test';
const cfg = !test ? configs.db : {
  host: 'localhost',
  port: 5432,
  database: 'qmobile_test',
  username: 'postgres',
  password: 'postgres',
  logging: false
};

const sequelize = new Sequelize({
    database: cfg.database,
    username: cfg.username,
    password: cfg.password,
    dialect: 'postgres',
    host: cfg.host,
    port: cfg.port,
    logging: cfg.logging,
    operatorsAliases: false
});

sequelize.addModels([
  Turma,
  Usuario,
  Nota,
  Disciplina,
  UsuarioDisciplina,
  Session
]);

export = sequelize;
