import * as orm from './models/orm';
import * as pool from './services/driver/pool';
import { PocketServer } from '../test/webserver';

beforeAll(done => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10e8;
  Promise.all([
    orm.sync({ force: true }),
    PocketServer.getInstance().start()
  ]).then(done).catch(done.fail);
});

afterAll(done => {
  orm.close();
  Promise.all([
    pool.clear(),
    PocketServer.getInstance().stop()
  ]).then(done).catch(done.fail);
});
