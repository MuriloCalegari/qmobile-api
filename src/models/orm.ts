import * as Sequelize from 'sequelize';

const sequelize = new Sequelize('qmobile', 'root', '', {
    host: 'localhost'
});

export = sequelize;