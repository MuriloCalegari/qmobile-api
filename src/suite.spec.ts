import * as orm from './models/orm';

beforeAll(done => {
  orm.sync({ force: true }).then(done).catch(done.fail);
});

afterAll(() => {
  orm.close();
});
