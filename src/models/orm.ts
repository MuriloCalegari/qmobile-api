import * as configs from '../configs';
import * as Sequelize from 'sequelize';

const cfg = configs.db;

const sequelize = new Sequelize(cfg.database, cfg.username, cfg.password, {
    dialect: 'postgres',
    host: cfg.host,
    port: cfg.port,
    logging: configs.db.logging
});

export = sequelize;