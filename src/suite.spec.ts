import * as orm from './models/orm';
import { PocketServer } from '../test/webserver';

beforeAll(done => {
  Promise.all([
    orm.sync({ force: true }),
    PocketServer.getInstance().start()
  ]).then(done).catch(done.fail);
});

afterAll(done => {
  orm.close();
  PocketServer.getInstance().stop()
    .then(done).catch(done.fail);
});
