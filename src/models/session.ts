import * as Sequelize from 'sequelize';
import * as orm from './orm';
import * as Usuario from './usuario';

const Session = orm.define('session', {
    id: {
        type: Sequelize.UUIDV4,
        primaryKey: true
    },
    startdate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    },
    instanceid: {
        type: Sequelize.STRING
    }
});

Session.belongsTo(Usuario, { foreignKey: 'userid' });

export = Session;