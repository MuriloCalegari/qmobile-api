import { QAcademicoStrategy } from './index';
import { PocketServer } from './../../../../test/webserver';
import * as qauth from './qauth';
import { StrategyFactory, StrategyType } from '../factory';

describe('QAuth', () => {

  let server: PocketServer;
  let strategy: QAcademicoStrategy;

  beforeAll(async done => {
    server = PocketServer.getInstance();
    strategy = await StrategyFactory.build(StrategyType.QACADEMICO, 'http://localhost:9595') as any;
    done();
  });

  beforeEach(done => {
    strategy.init().then(done).catch(done.fail);
  });

  afterEach(done => {
    server.reset();
    strategy.release().then(done).catch(done.fail);
  });

  describe('login()', () => {
    it('deve logar com sucesso', async done => {
      const { state } = server;
      try {

        await qauth.login(strategy, 'test', 'pass');
        expect(state.loggedIn).toBeTruthy();
        expect(state.loginBody).toEqual(jasmine.objectContaining({
          LOGIN: 'test',
          SENHA: 'pass',
          TIPO_USU: '1'
        }));

        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('deve esperar login incorreto', async done => {
      const { state } = server;
      try {
        state.allowLogin = false;
        await qauth.login(strategy, 'test', 'incorreto');
        done.fail();
      } catch (e) {
        expect(state.loggedIn).toBeFalsy();
        expect(e).toEqual(jasmine.any(Error));
        expect(e.message).toBe('Senha incorreta');

        done();
      }
    });

    it('deve esperar erro no browser', async done => {
      const { state } = server;
      try {
        state.allowLogin = false;
        strategy.endpoint = 'http://localhost';
        await qauth.login(strategy, 'test', 'incorreto');
        done.fail();
      } catch (e) {
        expect(state.loggedIn).toBeFalsy();
        expect(e).toEqual(jasmine.any(Error));
        expect(e.message).toBeTruthy();

        done();
      }
    });
  });

});
