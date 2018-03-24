import { QAcademicoStrategy } from './index';
import { PocketServer } from './../../../../test/webserver';
import * as qauth from './qauth';
import { StrategyFactory, StrategyType } from '../factory';
import { asyncTest } from '../../../test-utils';
const rsa = require('./lib/rsa.js');

describe('QAuth', () => {

  let server: PocketServer;
  let strategy: QAcademicoStrategy;

  beforeAll(asyncTest(async () => {
    server = PocketServer.getInstance();
    strategy = await StrategyFactory.build(StrategyType.QACADEMICO, 'http://localhost:9595') as any;
  }));

  beforeEach(() => {
    strategy.init();
    spyOn(rsa, 'encryptedString').and.returnValue('encrypted');
  });

  afterEach(asyncTest(async () => {
    server.reset();
    strategy.release();
  }));

  describe('login()', () => {
    it('deve logar com sucesso', asyncTest(async () => {
      const { state } = server;
      await qauth.login(strategy, 'test', 'pass');
      expect(state.loggedIn).toBeTruthy();
      expect(state.loginBody).toEqual(jasmine.objectContaining({
        LOGIN: 'encrypted',
        SENHA: 'encrypted',
        TIPO_USU: 'encrypted'
      }));
    }));

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
