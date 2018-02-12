import { Disciplina } from './disciplina';
import { Usuario } from './usuario';
import { Turma } from './turma';
import { Nota } from './nota';
import { UsuarioDisciplina } from './usuario_disciplina';
import { Session } from './session';

import * as configs from '../configs';
import { Sequelize } from 'sequelize-typescript';

const cfg = configs.db;

const sequelize = new Sequelize({
    database: cfg.database,
    username: cfg.username,
    password: cfg.password,
    dialect: 'postgres',
    host: cfg.host,
    port: cfg.port,
    logging: configs.db.logging
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
