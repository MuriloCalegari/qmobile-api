import { DATA_FOLDER } from './constants';
import { StrategyType } from './services/strategy/factory';
import { PocketServer } from '../test/webserver';
import { DatabaseService } from './database/database';
import { EndpointService } from './database/endpoint';
import * as fs from 'fs-extra';

type TestFn = (done?: DoneFn) => Promise<void> | void;

export function asyncTest(fn: TestFn): TestFn {
  return async function (done) {
    try {
      await fn();
      done!();
    } catch (e) {
      console.error(e);
      done!.fail(e);
    }
  };
}

export async function clearDatabase() {
  await DatabaseService.truncate([
    'nota', 'disciplina', 'endpoint', 'usuario',
    'professor', 'disciplina_professor', 'usuario_disciplina',
    'session'
  ]);
  await EndpointService.findOrCreate('http://localhost:9595', StrategyType.QACADEMICO);
}

beforeAll(asyncTest(async () => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10e6;
  if (!(await fs.pathExists(DATA_FOLDER))) {
    await fs.mkdir(DATA_FOLDER);
  }
  await Promise.all([
    (async () => {
      await DatabaseService.createTables();
      await clearDatabase();
    })(),
    PocketServer.getInstance().start()
  ]);
}));

afterAll(asyncTest(async () => {
  const [db] = await Promise.all([
    DatabaseService.getDatabase()
  ]);
  await Promise.all([
    db.end(),
    PocketServer.getInstance().stop()
  ]);
}));
