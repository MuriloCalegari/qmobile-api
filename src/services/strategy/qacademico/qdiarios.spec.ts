import { StrategyType, StrategyFactory, NumeroEtapa } from './../factory';
import { QAcademicoStrategy } from './index';
import { PocketServer } from './../../../../test/webserver';
import * as qauth from './qauth';
import { QDiarios } from './qdiarios';

describe('QDiarios', () => {

  let server: PocketServer;
  let strategy: QAcademicoStrategy;

  beforeAll(async done => {
    server = PocketServer.getInstance();
    strategy = await StrategyFactory.build(StrategyType.QACADEMICO, 'http://localhost:9595') as any;
    await strategy.login('test', 'pass');
    spyOn(strategy.page, 'goto').and.callThrough();
    spyOn(strategy, 'release').and.returnValue(Promise.resolve());
    done();
  });

  afterEach(async done => {
    server.reset();
    server.state.loggedIn = true;
    await strategy.page.goto('http://localhost:9595/index.asp?t=2000');
    done();
  });

  afterAll(done => {
    (strategy.release as jasmine.Spy).and.callThrough();
    strategy.release().then(done).catch(done.fail);
  });

  describe('openDiarios()', () => {
    it('deve ir para a página dos diários', async done => {
      try {
        await QDiarios.openDiarios(strategy);
        expect(strategy.page.goto).toHaveBeenCalledWith(
          'http://localhost:9595/index.asp?t=2071'
        );
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('não deve navegar se já estiver na página', async done => {
      try {
        await strategy.page.goto('http://localhost:9595/index.asp?t=2071');
        (strategy.page.goto as jasmine.Spy).calls.reset();
        await QDiarios.openDiarios(strategy);
        expect(strategy.page.goto).not.toHaveBeenCalled();

        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('deve fechar o navegador se houver erro', async done => {
      try {
        spyOn(strategy.page, 'url').and.callFake(
          () => Promise.reject(new Error('panic'))
        );
        await QDiarios.openDiarios(strategy);

        done.fail();
      } catch (e) {
        expect(strategy.release).toHaveBeenCalledWith(true);
        expect(e).toEqual(jasmine.any(Error));
        expect(e.message).toBe('panic');
        done();
      }
    });
  });

  describe('getTurmas()', () => {

    beforeEach(done =>
      QDiarios.openDiarios(strategy).then(done).catch(done.fail)
    );

    it('deve abrir a página de diarios', async done => {
      try {
        await strategy.page.goto('http://localhost:9595/index.asp?t=2000');
        (strategy.page.goto as any).and.callThrough();
        await QDiarios.getTurmas(strategy);
        expect(strategy.page.goto).toHaveBeenCalledWith(
          'http://localhost:9595/index.asp?t=2071'
        );
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('deve ler todas as notas listadas', async done => {
      try {
        const turmas = await QDiarios.getTurmas(strategy);

        expect(turmas.length).toBe(1);
        turmas.forEach(({ disciplinas, nome }) => {

          expect(nome).toBeTruthy();
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
        });
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('deve esperar erro no browser', async done => {
      try {
        spyOn(strategy.page, 'url').and.callFake(
          () => Promise.reject(new Error('panic'))
        );
        await QDiarios.getTurmas(strategy);
        done.fail();
      } catch (e) {
        expect(e).toEqual(jasmine.any(Error));
        expect(strategy.release).toHaveBeenCalledWith(true);
        done();
      }
    });

  });

});
