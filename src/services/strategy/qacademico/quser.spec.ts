import { QAcademicoStrategy } from './index';
import { PocketServer } from './../../../../test/webserver';
import * as quser from './quser';
import * as imageSize from 'image-size';
import { StrategyFactory, StrategyType } from '../factory';
import { asyncTest } from '../../../test-utils';

describe('QUser', () => {

  let server: PocketServer;
  let strategy: QAcademicoStrategy;

  beforeAll(asyncTest(async () => {
    server = PocketServer.getInstance();
    server.reset();
    server.state.loggedIn = true;
    strategy = await StrategyFactory.build(StrategyType.QACADEMICO, 'http://localhost:9595') as any;
    await strategy.login('test', 'pass');
    spyOn(strategy, 'release').and.returnValue(Promise.resolve());
  }));

  afterAll(asyncTest(async () => {
    (strategy.release as jasmine.Spy).and.callThrough();
    strategy.release();
  }));

  describe('getName()', () => {

    it('deve buscar a página inicial', asyncTest(async () => {
      spyOn(strategy, 'getUrl').and.callThrough();
      await quser.getName(strategy);
      expect(strategy.getUrl).toHaveBeenCalledWith(
        'http://localhost:9595/index.asp?t=2000'
      );
    }));

    it('deve esperar por erro no servidor', async done => {
      try {
        spyOn(strategy, 'getUrl').and.callFake(() => Promise.reject(new Error('panic')));
        await quser.getName(strategy);
        done.fail();
      } catch (e) {
        expect(strategy.release).toHaveBeenCalledWith(true);
        expect(e).toEqual(jasmine.any(Error));
        expect(e.message).toBe('Falha ao buscar os dados');
        done();
      }
    });

    it('deve buscar o nome correto do usuario', asyncTest(async () => {
      const nome = await quser.getName(strategy);
      expect(nome).toBe('Aluno Teste');
    }));

    it('deve falhar se não achar um nome', async done => {
      try {
        spyOn(strategy, 'getUrl').and.returnValue(
          Promise.resolve('<div class="barraRodape"></div>')
        );
        await quser.getName(strategy);
        done.fail();
      } catch (e) {
        expect(e).toEqual(jasmine.any(Error));
        expect(e.message).toBe('Falha ao buscar os dados');
        done();
      }
    });

  });

  describe('getPhoto()', () => {

    it('deve buscar a página inicial', asyncTest(async () => {
      spyOn(strategy, 'getUrl').and.callThrough();
      await quser.getPhoto(strategy);
      expect(strategy.getUrl).toHaveBeenCalledWith(
        'http://localhost:9595/index.asp?t=2000'
      );
    }));

    it('deve buscar a foto', asyncTest(async () => {
      spyOn(strategy, 'getFile').and.callThrough();
      await quser.getPhoto(strategy);
      expect(strategy.getFile).toHaveBeenCalledWith(
        'http://localhost:9595/user.png'
      );
    }));

    it('deve ocorrer um erro caso não seja possivel obter a foto', async done => {
      try {
        spyOn(strategy, 'getFile').and.callFake(() => Promise.reject({}));
        await quser.getPhoto(strategy);
        done.fail();
      } catch (e) {
        expect(e).toEqual(jasmine.any(Error));
        expect(e.message).toBe('Falha ao buscar os dados');
        done();
      }
    });

    it('deve buscar a imagem correta do usuário', asyncTest(async () => {
      const imagem = await quser.getPhoto(strategy);
      const { height, width } = imageSize(imagem);
      expect(height).toBe(128);
      expect(width).toBe(128);
    }));

  });

});
