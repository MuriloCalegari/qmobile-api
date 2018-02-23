import { QAcademicoStrategy } from './index';
import { PocketServer } from './../../../../test/webserver';
import * as quser from './quser';
import * as imageSize from 'image-size';
import { StrategyFactory, StrategyType } from '../factory';

describe('QUser', () => {

  let server: PocketServer;
  let strategy: QAcademicoStrategy;

  beforeAll(async done => {
    server = PocketServer.getInstance();
    server.reset();
    server.state.loggedIn = true;
    strategy = await StrategyFactory.build(StrategyType.QACADEMICO, 'http://localhost:9595') as any;
    await strategy.login('test', 'pass');
    spyOn(strategy.page, 'goto').and.callThrough();
    spyOn(strategy, 'release').and.returnValue(Promise.resolve());
    done();
  });

  afterEach(async done => {
    await strategy.page.goto('http://localhost:9595/index.asp?t=2000');
    done();
  });

  afterAll(done => {
    (strategy.release as jasmine.Spy).and.callThrough();
    strategy.release().then(done).catch(done.fail);
  });

  describe('getName()', () => {

    it('deve navegar para a página inicial se não estiver', async done => {
      try {
        await strategy.page.goto('http://localhost:9595/index.asp?t=2071');
        await quser.getName(strategy);
        expect(strategy.page.goto).toHaveBeenCalledWith(
          'http://localhost:9595/index.asp?t=2000'
        );
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('deve esperar por erro no servidor', async done => {
      try {
        spyOn(strategy.page, 'url').and.callFake(() => Promise.reject(new Error('panic')));
        await quser.getName(strategy);
        done.fail();
      } catch (e) {
        expect(strategy.release).toHaveBeenCalledWith(true);
        expect(e).toEqual(jasmine.any(Error));
        expect(e.message).toBe('Falha ao buscar os dados');
        done();
      }
    });

    it('deve buscar o nome correto do usuario', async done => {
      try {
        const nome = await quser.getName(strategy);
        expect(nome).toBe('Aluno Teste');
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('deve falhar se não achar um nome', async done => {
      try {
        spyOn(strategy.page, 'content').and.returnValue(
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

    it('deve navegar para a página inicial se não estiver', async done => {
      try {
        await strategy.page.goto('http://localhost:9595/index.asp?t=2071');
        await quser.getPhoto(strategy);
        expect(strategy.page.goto).toHaveBeenCalledWith(
          'http://localhost:9595/index.asp?t=2000'
        );
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('deve injetar script na página', async done => {
      try {
        spyOn(strategy.page, 'evaluate').and.callThrough();
        await quser.getPhoto(strategy);
        expect(strategy.page.evaluate).toHaveBeenCalled();
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('deve ocorrer um erro caso não seja possivel obter a foto', async done => {
      try {
        spyOn(strategy.page, 'evaluate').and.callFake(() => Promise.reject({}));
        await quser.getPhoto(strategy);
        done.fail();
      } catch (e) {
        expect(e).toEqual(jasmine.any(Error));
        expect(e.message).toBe('Falha ao buscar os dados');
        done();
      }
    });

    it('deve buscar a imagem correta do usuário', async done => {
      try {
        const imagem = await quser.getPhoto(strategy);
        const { height, width } = imageSize(imagem);
        expect(height).toBe(128);
        expect(width).toBe(128);
        done();
      } catch (e) {
        done.fail(e);
      }
    });

  });

});
