import { PocketServer } from './../../../test/webserver';
import * as qauth from './qauth';

describe('QAuth', () => {

  let server: PocketServer;

  beforeAll(() => {
    server = PocketServer.getInstance();
  });

  afterEach(() => {
    server.reset();
  });

  describe('login()', () => {
    it('deve logar com sucesso', async done => {
      const { state } = server;
      try {

        const browser = await qauth.login('http://localhost:9595', 'test', 'pass');
        expect(state.loggedIn).toBeTruthy();
        expect(state.loginBody).toEqual(jasmine.objectContaining({
          LOGIN: 'test',
          SENHA: 'pass',
          TIPO_USU: '1'
        }));
        await browser.exit();

        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('deve esperar login incorreto', async done => {
      const { state } = server;
      try {
        state.allowLogin = false;
        const browser = await qauth.login('http://localhost:9595', 'test', 'incorreto');
        await browser.exit();
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
        const browser = await qauth.login('http://localhost', 'test', 'incorreto');
        await browser.exit();
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