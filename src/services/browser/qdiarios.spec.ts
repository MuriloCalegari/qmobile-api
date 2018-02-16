import { PocketServer } from './../../../test/webserver';
import * as qdiarios from './qdiarios';
import * as qauth from './qauth';
import { QBrowser } from '../driver/qbrowser';
import { NumeroEtapa } from './qdiarios';

describe('QDiarios', () => {

  let server: PocketServer;
  let browser: QBrowser;

  beforeAll(async done => {
    server = PocketServer.getInstance();
    browser = await qauth.login('http://localhost:9595', 'test', 'pass');
    spyOn(browser.getDriver(), 'get').and.callThrough();
    spyOn(browser, 'exit').and.returnValue(Promise.resolve());
    done();
  });

  afterEach(async done => {
    server.reset();
    server.state.loggedIn = true;
    await browser.getDriver().get('http://localhost:9595/index.asp?t=2000');
    done();
  });

  afterAll(done => {
    (browser.exit as jasmine.Spy).and.callThrough();
    browser.exit().then(done).catch(done.fail);
  });

  describe('openDiarios()', () => {
    it('deve ir para a página dos diários', async done => {
      try {
        await qdiarios.openDiarios(browser);
        expect(browser.getDriver().get).toHaveBeenCalledWith(
          'http://localhost:9595/index.asp?t=2071'
        );
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('não deve navegar se já estiver na página', async done => {
      try {
        await browser.getDriver().get('http://localhost:9595/index.asp?t=2071');
        (browser.getDriver().get as jasmine.Spy).calls.reset();
        await qdiarios.openDiarios(browser);
        expect(browser.getDriver().get).not.toHaveBeenCalled();

        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('deve fechar o navegador se houver erro', async done => {
      try {
        spyOn(browser.getDriver(), 'getCurrentUrl').and.callFake(
          () => Promise.reject(new Error('panic'))
        );
        await qdiarios.openDiarios(browser);

        done.fail();
      } catch (e) {
        expect(browser.exit).toHaveBeenCalledWith(true);
        expect(e).toEqual(jasmine.any(Error));
        expect(e.message).toBe('panic');
        done();
      }
    });
  });

  describe('getDisciplinas()', () => {

    beforeEach(done =>
      qdiarios.openDiarios(browser).then(done).catch(done.fail)
    );

    it('deve abrir a página de diarios', async done => {
      try {
        await browser.getDriver().get('http://localhost:9595/index.asp?t=2000');
        (browser.getDriver().get as any).and.callThrough();
        await qdiarios.getDisciplinas(browser);
        expect(browser.getDriver().get).toHaveBeenCalledWith(
          'http://localhost:9595/index.asp?t=2071'
        );
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('deve ler todos as notas listadas', async done => {
      try {
        const disciplinas = await qdiarios.getDisciplinas(browser);

        expect(disciplinas.length).toBe(12);
        expect(disciplinas.some(({ etapas }) => etapas.length > 0)).toBeTruthy();
        expect(disciplinas.some(({ etapas }) => etapas.length === 0)).toBeTruthy();
        expect(disciplinas
          .some(({ etapas }) =>
            etapas.every(({ notas }) => notas.length > 0)
          )).toBeTruthy();
        expect(disciplinas.every(disc => disc.etapas.length < 5)).toBeTruthy();

        disciplinas.forEach(disciplina => {
          expect(disciplina.turma).toBe('00001.TS.TII_I.4M');
          expect(disciplina.nome).toBeTruthy();
          expect(disciplina.professor).toBeTruthy();
          disciplina.etapas.forEach(etapa => {
            expect([
              NumeroEtapa.ETAPA1,
              NumeroEtapa.ETAPA2,
              NumeroEtapa.RP_ETAPA1,
              NumeroEtapa.RP_ETAPA2
            ]).toContain(etapa.numero);
            etapa.notas.forEach(nota => {
              expect(nota.descricao).toBeTruthy();
              expect(nota.nota).toBeDefined();
              expect(nota.notamaxima).toBeDefined();
              expect(nota.peso).toBeDefined();
            });
          });
        });
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('deve esperar erro no browser', async done => {
      try {
        spyOn(browser.getDriver(), 'getPageSource').and.callFake(
          () => Promise.reject(new Error('panic'))
        );
        await qdiarios.getDisciplinas(browser);
        done.fail();
      } catch (e) {
        expect(e).toEqual(jasmine.any(Error));
        expect(browser.exit).toHaveBeenCalledWith(true);
        done();
      }
    });

  });

});
