import { PocketServer } from './../../../test/webserver';
import * as quser from './quser';
import * as qauth from './qauth';
import * as imageSize from 'image-size';
import { QBrowser } from '../driver/qbrowser';

describe('QUser', () => {

  let server: PocketServer;
  let browser: QBrowser;

  beforeAll(async done => {
    server = PocketServer.getInstance();
    server.reset();
    server.state.loggedIn = true;
    browser = await qauth.login('http://localhost:9595', 'test', 'pass');
    spyOn(browser.getPage(), 'goto').and.callThrough();
    spyOn(browser, 'exit').and.returnValue(Promise.resolve());
    done();
  });

  afterEach(async done => {
    await browser.getPage().goto('http://localhost:9595/index.asp?t=2000');
    done();
  });

  afterAll(done => {
    (browser.exit as jasmine.Spy).and.callThrough();
    browser.exit().then(done).catch(done.fail);
  });

  describe('getName()', () => {

    it('deve navegar para a página inicial se não estiver', async done => {
      try {
        await browser.getPage().goto('http://localhost:9595/index.asp?t=2071');
        await quser.getName(browser);
        expect(browser.getPage().goto).toHaveBeenCalledWith(
          'http://localhost:9595/index.asp?t=2000'
        );
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('deve esperar por erro no servidor', async done => {
      try {
        spyOn(browser.getPage(), 'url').and.callFake(() => Promise.reject(new Error('panic')));
        await quser.getName(browser);
        done.fail();
      } catch (e) {
        expect(browser.exit).toHaveBeenCalledWith(true);
        expect(e).toEqual(jasmine.any(Error));
        expect(e.message).toBe('Falha ao buscar os dados');
        done();
      }
    });

    it('deve buscar o nome correto do usuario', async done => {
      try {
        const nome = await quser.getName(browser);
        expect(nome).toBe('Aluno Teste');
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('deve falhar se não achar um nome', async done => {
      try {
        spyOn(browser.getPage(), 'content').and.returnValue(
          Promise.resolve('<div class="barraRodape"></div>')
        );
        await quser.getName(browser);
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
        await browser.getPage().goto('http://localhost:9595/index.asp?t=2071');
        await quser.getPhoto(browser);
        expect(browser.getPage().goto).toHaveBeenCalledWith(
          'http://localhost:9595/index.asp?t=2000'
        );
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('deve injetar script na página', async done => {
      try {
        spyOn(browser.getPage(), 'evaluate').and.callThrough();
        await quser.getPhoto(browser);
        expect(browser.getPage().evaluate).toHaveBeenCalled();
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('deve ocorrer um erro caso não seja possivel obter a foto', async done => {
      try {
        spyOn(browser.getPage(), 'evaluate').and.callFake(() => Promise.reject({}));
        await quser.getPhoto(browser);
        done.fail();
      } catch (e) {
        expect(e).toEqual(jasmine.any(Error));
        expect(e.message).toBe('Falha ao buscar os dados');
        done();
      }
    });

    it('deve buscar a imagem correta do usuário', async done => {
      try {
        const imagem = await quser.getPhoto(browser);
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