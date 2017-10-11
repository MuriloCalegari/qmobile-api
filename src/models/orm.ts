import * as Sequelize from 'sequelize';

const sequelize = new Sequelize('qmobile', 'postgres', '12345', {
    dialect: 'postgres',
    host: 'localhost',
    port: 5432
});

export = sequelize;