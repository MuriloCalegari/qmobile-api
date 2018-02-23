import { IStrategy, StrategyFactory, StrategyType } from './../services/strategy/factory';
import { JobNota, NotasTask } from './notas';
import * as kue from 'kue';
import * as configs from '../configs';

export namespace TaskQueue {

  let queue: kue.Queue | null;

  export function getQueue(): kue.Queue {
    if (!queue) {
      queue = kue.createQueue();
      queue.setMaxListeners(configs.update_queue_size + 5);
    }
    return queue;
  }

  export function shutdown(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (queue) {
        queue.shutdown(2000, (err?: Error) => {
          if (err) { return reject(err); }
          queue = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  export function startRunner(): void {
    TaskQueue.getQueue()
      .process('readnotas', configs.update_queue_size, async (jobinfo, done) => {
        let strategy: IStrategy | undefined;
        try {

          const { endpoint, matricula, senha }: JobNota = jobinfo.data;
          strategy = (await StrategyFactory.build(StrategyType.QACADEMICO, endpoint))!;
          await strategy.login(matricula, senha);
          await NotasTask.updateRemote(strategy, matricula);
          await strategy.release();
          done();

        } catch (e) {
          try {
            await strategy!.release(true);
          } catch { }
          done(e);
        }
      });
  }

}

