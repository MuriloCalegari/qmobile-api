import { StrategyType } from './services/strategy/factory';
import { PocketServer } from '../test/webserver';
import { DatabaseService } from './database/database';
import { PoolService } from './services/driver/pool';
import { EndpointService } from './database/endpoint';

type TestFn = (done?: DoneFn) => Promise<void> | void;

export function asyncTest(fn: TestFn): TestFn {
  return async function (done) {
    try {
      await fn();
      done!();
    } catch (e) {
      done!.fail(e);
    }
  };
}

beforeAll(asyncTest(async () => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10e6;
  await Promise.all([
    (async () => {
      await DatabaseService.createTables();
      await DatabaseService.truncate([
        'nota', 'disciplina', 'endpoint', 'usuario',
        'professor', 'disciplina_professor', 'usuario_disciplina',
        'session'
      ]);
      await EndpointService.findOrCreate('http://localhost:9595', StrategyType.QACADEMICO);
    })(),
    PocketServer.getInstance().start()
  ]);
}));

afterAll(asyncTest(async () => {
  const [db, pool] = await Promise.all([
    DatabaseService.getDatabase(),
    PoolService.getPool()
  ]);
  await Promise.all([
    db.end(),
    pool.clear(),
    PocketServer.getInstance().stop()
  ]);
}));
