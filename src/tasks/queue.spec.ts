import { StrategyType } from './../services/strategy/factory';
import { TaskQueue } from './queue';
import * as kue from 'kue';
import { NotasTask } from './notas';
import { StrategyFactory } from '../services/strategy/factory';

type Runner = (jobinfo: kue.Job, done: (err?: Error) => void) => void;

describe('TaskQueue', () => {

  beforeAll(done => {
    TaskQueue.shutdown().then(done).catch(done.fail);
  });

  beforeEach(() => {
    spyOn(kue, 'createQueue').and.returnValue(
      jasmine.createSpyObj('queue', {
        setMaxListeners: jasmine.createSpy('setMaxListeners'),
        process: jasmine.createSpy('process'),
        shutdown: jasmine.createSpy('shutdown')
      })
    );
  });

  describe('getQueue()', () => {

    it('deve conectar e iniciar o queue pela primeira vez', () => {
      const queue = TaskQueue.getQueue();
      expect(queue).toBeTruthy();
      expect(kue.createQueue).toHaveBeenCalled();
      expect(queue.setMaxListeners).toHaveBeenCalled();
    });

    it('não deve iniciar o queue outras vezes', () => {
      const queue = TaskQueue.getQueue();
      expect(queue).toBeTruthy();
      expect(kue.createQueue).not.toHaveBeenCalled();
    });

  });

  fdescribe('startRunner()', () => {

    let runner: Runner;

    fit('deve adicionar um processador de tasks', () => {
      const queue = TaskQueue.getQueue();
      TaskQueue.startRunner();

      expect(queue.process).toHaveBeenCalledWith('readnotas', jasmine.any(Number), jasmine.any(Function));
      runner = (queue.process as jasmine.Spy).calls.first().args[2];
      expect(runner).toBeTruthy();
      expect(runner).toEqual(jasmine.any(Function));
    });

    describe('runner', () => {

      let browser: any;

      beforeEach(() => {
        browser = jasmine.createSpyObj('strategy', {
          release: Promise.resolve(),
          login: Promise.resolve()
        });
        spyOn(StrategyFactory, 'build').and.returnValue(
          Promise.resolve(browser)
        );
        spyOn(NotasTask, 'updateRemote').and.returnValue(Promise.resolve());
      });

      fit('deve logar na conta do usuário', done => {
        runner(
          {
            data: {
              endpoint: 'e',
              matricula: 'm',
              senha: 's'
            }
          } as any,
          err => {
            expect(err).toBeFalsy();
            expect(StrategyFactory.build).toHaveBeenCalledWith(jasmine.any(StrategyType), 'e');
            expect(browser.login).toHaveBeenCalledWith('m', 's');
            done();
          }
        );
      });

      it('deve atualizar os dados remotos', done => {
        runner(
          {
            data: {
              endpoint: 'e',
              matricula: 'm',
              senha: 's'
            }
          } as any,
          err => {
            expect(err).toBeFalsy();
            expect(NotasTask.updateRemote).toHaveBeenCalledWith(browser, 'm');
            done();
          }
        );
      });

      it('deve fechar o browser', done => {
        runner(
          {
            data: {
              endpoint: 'e',
              matricula: 'm',
              senha: 's'
            }
          } as any,
          err => {
            expect(err).toBeFalsy();
            expect(browser.release).toHaveBeenCalledWith();
            done();
          }
        );
      });

      it('deve esperar erro', done => {
        (NotasTask.updateRemote as jasmine.Spy).and.callFake(() => Promise.reject({ err: 1 }));
        runner(
          {
            data: {
              endpoint: 'e',
              matricula: 'm',
              senha: 's'
            }
          } as any,
          err => {
            expect(err).toBeTruthy();
            expect(err as any).toEqual({ err: 1 });
            expect(browser.release).toHaveBeenCalledWith(true);
            done();
          }
        );
      });

    });

  });

  describe('shutdown()', () => {

    it('deve desligar queue atual', async done => {
      try {
        const queue = TaskQueue.getQueue();
        (queue.shutdown as jasmine.Spy).and.callFake((n: any, cb: Function) => cb());
        await TaskQueue.shutdown();
        expect(queue.shutdown).toHaveBeenCalledWith(2000, jasmine.any(Function));
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('deve propagar erro', async done => {
      try {
        const queue = TaskQueue.getQueue();
        (queue.shutdown as jasmine.Spy).and.callFake((n: any, cb: Function) => cb('panic'));
        await TaskQueue.shutdown();
        done.fail('não propagou erro');
      } catch (e) {
        expect(e).toBeTruthy();
        expect(e).toBe('panic');
        done();
      }
    });

    it('não deve desligar duas vezes', async done => {
      try {
        const queue = TaskQueue.getQueue();
        (queue.shutdown as jasmine.Spy)
          .and.callFake((n: any, cb: Function) => cb())
          .calls.reset();
        await TaskQueue.shutdown();
        await TaskQueue.shutdown();
        expect(queue.shutdown).toHaveBeenCalledTimes(1);
        done();
      } catch (e) {
        done.fail(e);
      }
    });

  });

});
