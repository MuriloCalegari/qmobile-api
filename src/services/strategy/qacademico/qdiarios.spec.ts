import { StrategyType, StrategyFactory, NumeroEtapa } from './../factory';
import { QAcademicoStrategy } from './index';
import { PocketServer } from './../../../../test/webserver';
import * as qauth from './qauth';
import { QDiarios } from './qdiarios';
import { asyncTest } from '../../../test-utils';
import axios from 'axios';

describe('QDiarios', () => {

  let server: PocketServer;
  let strategy: QAcademicoStrategy;

  beforeAll(asyncTest(async () => {
    server = PocketServer.getInstance();
    strategy = await StrategyFactory.build(StrategyType.QACADEMICO, 'http://localhost:9595') as any;
    await strategy.login('test', 'pass');
    spyOn(strategy, 'release').and.returnValue(Promise.resolve());
  }));

  afterEach(() => {
    server.reset();
    server.state.loggedIn = true;
  });

  afterAll(done => {
    (strategy.release as jasmine.Spy).and.callThrough();
    strategy.release().then(done).catch(done.fail);
  });

  describe('getPeriodo()', () => {

    const periodo = { codigo: '2017_1', nome: '2017/1' };

    it('deve abrir a página de diarios', asyncTest(async () => {
      spyOn(axios, 'post').and.callThrough();
      await QDiarios.getPeriodo(strategy, periodo);
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:9595/index.asp?t=2071',
        'ANO_PERIODO2=2017_1',
        jasmine.any(Object)
      );
    }));

    it('deve ler todas as notas listadas', asyncTest(async () => {
      const { disciplinas } = await QDiarios.getPeriodo(strategy, periodo);
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
    }));

    it('deve esperar erro no browser', async done => {
      try {
        spyOn(axios, 'post').and.callFake(
          () => Promise.reject(new Error('panic'))
        );
        await QDiarios.getPeriodo(strategy, periodo);
        done.fail();
      } catch (e) {
        expect(e).toEqual(jasmine.any(Error));
        expect(strategy.release).toHaveBeenCalledWith(true);
        done();
      }
    });

  });

});
