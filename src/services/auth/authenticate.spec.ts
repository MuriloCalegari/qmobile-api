import { EndpointDto, EndpointService } from './../../database/endpoint';
import { asyncTest } from '../../test-utils';
import * as cipher from '../cipher/cipher';
import * as photo from '../photo/photo';
import * as fs from 'fs';
import * as authService from './authenticate';

import { PocketServer } from './../../../test/webserver';
import * as imageSize from 'image-size';
import { StrategyFactory, IStrategy, StrategyType } from '../strategy/factory';
import { DatabaseService } from '../../database/database';

describe('AuthService:auth', () => {

  let server: PocketServer;
  let strategy: IStrategy;
  let endpoint: EndpointDto;

  beforeAll(asyncTest(async () => {
    [, endpoint] = await EndpointService.findOrCreate('http://localhost:9595', StrategyType.QACADEMICO);
    strategy = (await StrategyFactory.build(StrategyType.QACADEMICO, 'http://localhost:9595'))!;

    spyOn(StrategyFactory, 'build').and.returnValue(Promise.resolve(strategy));
    spyOn(strategy, 'login').and.callThrough();
    spyOn(strategy, 'getProfilePicture').and.callThrough();
    spyOn(strategy, 'getFullName').and.callThrough();
  }));

  afterAll(asyncTest(async () => {
    await strategy.release();
    server =
      strategy =
      endpoint = null as any;
  }));

  beforeEach(asyncTest(async () => {
    const db = await DatabaseService.truncate(['usuario']);
    server = PocketServer.getInstance();
    server.reset();
    server.state.loggedIn = true;
  }));

  afterEach(asyncTest(async () => {
    await strategy.release();
  }));

  it('deve seguir o fluxo corretamente', asyncTest(async () => {
    const [, user] = await authService.login('http://localhost:9595', 'test', 'pass');
    expect(user.id).toBeTruthy();
    expect(user.nome).toBe('Aluno Teste');
    expect(user.matricula).toBe('test');
    expect(user.endpoint.toString()).toBe(endpoint.id!.toString());
    expect(user.password).toBeTruthy();
    expect(fs.existsSync(photo.getPath(user.id!.toString()))).toBeTruthy();

    expect(strategy.login).toHaveBeenCalledWith('test', 'pass');
    expect(strategy.getFullName).toHaveBeenCalled();
    expect(strategy.getProfilePicture).toHaveBeenCalled();
  }));

  it('não deve buscar informacoes se ja houver no banco', asyncTest(async () => {
    const [, user1] = await authService.login('http://localhost:9595', 'test', 'pass');

    [
      strategy.login,
      strategy.getFullName,
      strategy.getProfilePicture as any
    ].forEach((spy: jasmine.Spy) => spy.calls.reset());

    const [, user2] = await authService.login('http://localhost:9595', 'test', 'pass');

    expect(user1.id!.toString()).toBe(user2.id!.toString());
    expect(strategy.login).not.toHaveBeenCalled();
    expect(strategy.getFullName).not.toHaveBeenCalled();
    expect(strategy.getProfilePicture).not.toHaveBeenCalled();
  }));

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
