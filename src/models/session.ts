import * as Sequelize from 'sequelize';
import * as orm from './orm';
import * as Usuario from './usuario';

interface DBSession {
  id?: string;
  startdate?: Date;
  instanceid?: string;
  userid?: string;
}

interface DBSessionInstance extends Sequelize.Instance<DBSession> { }

const Session = orm.define<DBSessionInstance, DBSession>('session', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
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
