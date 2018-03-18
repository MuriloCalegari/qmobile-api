import { UUID } from './../database/uuid';
import { StrategyType } from './../services/strategy/factory';
import { TaskQueue } from './queue';
import * as kue from 'kue';
import * as cipher from '../services/cipher/cipher';
import { NotasTask } from './notas';
import { StrategyFactory } from '../services/strategy/factory';
import { asyncTest } from '../test-utils';
import { UsuarioService } from '../database/usuario';
import { EndpointService } from '../database/endpoint';

type Runner = (jobinfo: kue.Job, done: (err?: Error) => void) => void;

describe('TaskQueue', () => {

  beforeAll(asyncTest(async () => {
    await TaskQueue.shutdown();
  }));

  beforeEach(() => {
    spyOn(kue, 'createQueue').and.returnValue(
      jasmine.createSpyObj('queue', {
        setMaxListeners: jasmine.createSpy('setMaxListeners'),
        process: jasmine.createSpy('process'),
        shutdown: jasmine.createSpy('shutdown')
      })
    );
    spyOn(cipher, 'decrypt').and.returnValue('decrypted');
  });

  describe('getQueue()', () => {

    it('deve conectar e iniciar o queue pela primeira vez', asyncTest(async () => {
      const queue = await TaskQueue.getQueue();
      expect(queue).toBeTruthy();
      expect(kue.createQueue).toHaveBeenCalled();
      expect(queue.setMaxListeners).toHaveBeenCalled();
    }));

    it('não deve iniciar o queue outras vezes', asyncTest(async () => {
      const queue = await TaskQueue.getQueue();
      expect(queue).toBeTruthy();
      expect(kue.createQueue).not.toHaveBeenCalled();
    }));

  });

  describe('startRunner()', () => {

    let runner: Runner;

    it('deve adicionar um processador de tasks', asyncTest(async () => {
      const queue = await TaskQueue.getQueue();
      await TaskQueue.startRunner();

      expect(queue.process).toHaveBeenCalledWith('readnotas', jasmine.any(Number), jasmine.any(Function));
      runner = (queue.process as jasmine.Spy).calls.first().args[2];
      expect(runner).toBeTruthy();
      expect(runner).toEqual(jasmine.any(Function));
    }));

    describe('runner', () => {

      let browser: any;
      let user: any;
      let endpoint: any;

      beforeEach(() => {
        browser = jasmine.createSpyObj('strategy', {
          release: Promise.resolve(),
          login: Promise.resolve()
        });
        spyOn(StrategyFactory, 'build').and.returnValue(
          Promise.resolve(browser)
        );
        user = {
          id: UUID.random(),
          matricula: 'abc',
          endpoint: UUID.random(),
          password: 'p'
        };
        endpoint = {
          id: UUID.random(),
          url: 'tst',
          strategy: 1
        };
        spyOn(NotasTask, 'updateRemote').and.returnValue(Promise.resolve());
        spyOn(UsuarioService, 'findById').and.returnValue(Promise.resolve(user));
        spyOn(EndpointService, 'getEndpointById').and.returnValue(Promise.resolve(endpoint));
      });

      it('deve buscar a conta do usuário', done => {
        runner(
          {
            data: {
              userid: user.id.toString()
            }
          } as any,
          err => {
            expect(err).toBeFalsy();
            expect(UsuarioService.findById).toHaveBeenCalledWith(jasmine.any(UUID));
            done();
          }
        );
      });

      it('deve buscar o endpoint do usuário', done => {
        runner(
          {
            data: {
              userid: user.id.toString()
            }
          } as any,
          err => {
            expect(err).toBeFalsy();
            expect(UsuarioService.findById).toHaveBeenCalledWith(jasmine.any(UUID));
            done();
          }
        );
      });

      it('deve logar na conta do usuário', done => {
        runner(
          {
            data: {
              userid: user.id.toString()
            }
          } as any,
          err => {
            expect(err).toBeFalsy();
            expect(StrategyFactory.build).toHaveBeenCalledWith(endpoint.strategy, endpoint.url);
            expect(browser.login).toHaveBeenCalledWith(user.matricula, 'decrypted');
            done();
          }
        );
      });

      it('deve atualizar os dados remotos', done => {
        runner(
          {
            data: {
              userid: user.id.toString()
            }
          } as any,
          err => {
            expect(err).toBeFalsy();
            expect(NotasTask.updateRemote).toHaveBeenCalledWith(browser, user.matricula);
            done();
          }
        );
      });

      it('deve fechar o browser', done => {
        runner(
          {
            data: {
              userid: user.id.toString()
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
              userid: user.id.toString()
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

    it('deve desligar queue atual', asyncTest(async () => {
      const queue = await TaskQueue.getQueue();
      (queue.shutdown as jasmine.Spy).and.callFake((n: any, cb: Function) => cb());
      await TaskQueue.shutdown();
      expect(queue.shutdown).toHaveBeenCalledWith(2000, jasmine.any(Function));
    }));

    it('deve propagar erro', async done => {
      try {
        const queue = await TaskQueue.getQueue();
        (queue.shutdown as jasmine.Spy).and.callFake((n: any, cb: Function) => cb('panic'));
        await TaskQueue.shutdown();
        done.fail('não propagou erro');
      } catch (e) {
        expect(e).toBeTruthy();
        expect(e).toBe('panic');
        done();
      }
    });

    it('não deve desligar duas vezes', asyncTest(async () => {
      const queue = await TaskQueue.getQueue();
      (queue.shutdown as jasmine.Spy)
        .and.callFake((n: any, cb: Function) => cb())
        .calls.reset();
      await TaskQueue.shutdown();
      await TaskQueue.shutdown();
      expect(queue.shutdown).toHaveBeenCalledTimes(1);
    }));

  });

});
