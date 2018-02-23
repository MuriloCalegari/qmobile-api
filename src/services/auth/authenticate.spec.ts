import { Usuario } from './../../models/usuario';
import * as cipher from '../cipher/cipher';
import * as photo from '../photo/photo';
import * as fs from 'fs';
import * as authService from './authenticate';

import { PocketServer } from './../../../test/webserver';
import * as imageSize from 'image-size';
import { NotasTask } from '../../tasks/notas';
import { StrategyFactory, IStrategy, StrategyType } from '../strategy/factory';

describe('AuthService:auth', () => {

  let server: PocketServer;
  let strategy: IStrategy;

  beforeAll(async done => {
    strategy = (await StrategyFactory.build(StrategyType.QACADEMICO, 'http://localhost:9595'))!;
    spyOn(StrategyFactory, 'build').and.returnValue(Promise.resolve(strategy));
    spyOn(strategy, 'login').and.callThrough();
    spyOn(strategy, 'getProfilePicture').and.callThrough();
    spyOn(strategy, 'getFullName').and.callThrough();
    done();
  });

  afterAll(done => {
    strategy.release().then(done).catch(done.fail);
  });

  beforeEach(done => {
    server = PocketServer.getInstance();
    server.reset();
    server.state.loggedIn = true;
    spyOn(NotasTask, 'updateRemote').and.returnValue(Promise.resolve());
    Usuario.truncate({ force: true, cascade: true }).then(done).catch(done.fail);
  });

  afterEach(done => {
    strategy.release().then(done).catch(done.fail);
  });

  it('deve seguir o fluxo corretamente', async done => {
    try {
      const user = await authService.login('http://localhost:9595', 'test', 'pass');
      expect(user.id).toBeTruthy();
      expect(user.nome).toBe('Aluno Teste');
      expect(user.matricula).toBe('test');
      expect(user.endpoint).toBe('http://localhost:9595');
      expect(user.password).toBeTruthy();
      expect(fs.existsSync(photo.getPath(user.id))).toBeTruthy();

      expect(strategy.login).toHaveBeenCalledWith('test', 'pass');
      expect(strategy.getFullName).toHaveBeenCalled();
      expect(strategy.getProfilePicture).toHaveBeenCalled();
      expect(NotasTask.updateRemote).toHaveBeenCalledWith(strategy, 'test');
      done();
    } catch (e) {
      done.fail(e);
    }
  });

  it('não deve buscar informacoes se ja houver no banco', async done => {
    try {
      const user1 = await authService.login('http://localhost:9595', 'test', 'pass');

      [
        strategy.login,
        strategy.getFullName,
        strategy.getProfilePicture as any
      ].forEach((spy: jasmine.Spy) => spy.calls.reset());

      const user2 = await authService.login('http://localhost:9595', 'test', 'pass');

      expect(user1.id).toBe(user2.id);
      expect(strategy.login).not.toHaveBeenCalled();
      expect(strategy.getFullName).not.toHaveBeenCalled();
      expect(strategy.getProfilePicture).not.toHaveBeenCalled();

      done();
    } catch (e) {
      done.fail(e);
    }
  });

  it('deve emitir erro com senha incorreta', async done => {
    try {
      await authService.login('http://localhost:9595', 'test', 'pass');

      await authService.login('http://localhost:9595', 'test', 'anotherpass');

      done.fail();
    } catch (e) {
      expect(e).toEqual(jasmine.any(Error));
      expect(e.message).toBe('Senha incorreta');
      done();
    }
  });

});
