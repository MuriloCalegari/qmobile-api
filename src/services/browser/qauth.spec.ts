import { PocketServer } from './../../../test/webserver';
import * as qauth from './qauth';

describe('QAuth', () => {

  let server: PocketServer;

  beforeAll(done => {
    server = new PocketServer();
    server.start().then(done).catch(done.fail);
  });

  afterEach(() => {
    server.reset();
  });

  afterAll(done => {
    server.stop().then(done).catch(done.fail);
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
        await browser.exit(true);

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
        await browser.exit(true);
        done.fail();
      } catch (e) {
        expect(state.loggedIn).toBeFalsy();
        expect(e).toEqual(jasmine.any(Error));
        expect(e.message).toBe('Senha incorreta');

        done();
      }
    });
  });

});
