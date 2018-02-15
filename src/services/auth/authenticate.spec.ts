import * as notasJob from '../../tasks/notas';
import * as qauth from '../browser/qauth';
import * as quser from '../browser/quser';
import * as orm from '../../models/orm';
import * as cipher from '../cipher/cipher';
import * as photo from '../photo/photo';
import * as fs from 'fs';
import * as authService from './authenticate';

import { PocketServer } from './../../../test/webserver';
import * as imageSize from 'image-size';

describe('AuthService:auth', () => {

  let server: PocketServer;

  beforeAll(async done => {
    server = new PocketServer();
    Promise.all([
      orm.sync({ force: true }),
      server.start()
    ]).then(done).catch(done.fail);
  });

  beforeEach(done => {
    spyOn(notasJob, 'retrieveData').and.returnValue(Promise.resolve());
    orm.sync({ force: true }).then(done).catch(done.fail);
  });

  afterEach(async done => {
    server.reset();
    server.state.loggedIn = true;
    done();
  });

  afterAll(done => {
    Promise.all([
      orm.close(),
      server.stop()
    ]).then(done).catch(done.fail);
  });

  it('deve seguir o fluxo corretamente', async done => {
    try {
      spyOn(qauth, 'login').and.callThrough();
      spyOn(quser, 'getName').and.callThrough();
      spyOn(quser, 'getPhoto').and.callThrough();

      const user = await authService.login('http://localhost:9595', 'test', 'pass');
      expect(user.id).toBeTruthy();
      expect(user.nome).toBe('Aluno Teste');
      expect(user.matricula).toBe('test');
      expect(user.endpoint).toBe('http://localhost:9595');
      expect(user.password).toBeTruthy();
      expect(fs.existsSync(photo.getPath(user.id))).toBeTruthy();

      expect(qauth.login).toHaveBeenCalledWith('http://localhost:9595', 'test', 'pass');
      expect(quser.getName).toHaveBeenCalled();
      expect(quser.getPhoto).toHaveBeenCalled();
      expect(notasJob.retrieveData).toHaveBeenCalledWith(jasmine.anything(), 'test');
      done();
    } catch (e) {
      done.fail(e);
    }
  });

  it('não deve buscar informacoes se ja houver no banco', async done => {
    try {
      const user1 = await authService.login('http://localhost:9595', 'test', 'pass');

      spyOn(qauth, 'login').and.callThrough();
      spyOn(quser, 'getName').and.callThrough();
      spyOn(quser, 'getPhoto').and.callThrough();

      const user2 = await authService.login('http://localhost:9595', 'test', 'pass');

      expect(user1.id).toBe(user2.id);
      expect(qauth.login).not.toHaveBeenCalled();
      expect(quser.getName).not.toHaveBeenCalled();
      expect(quser.getPhoto).not.toHaveBeenCalled();

      done();
    } catch (e) {
      done.fail(e);
    }
  });

});
