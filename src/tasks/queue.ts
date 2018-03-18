import { IStrategy, StrategyFactory, StrategyType } from './../services/strategy/factory';
import { JobNota, NotasTask } from './notas';
import * as kue from 'kue';
import { ConfigurationService } from '../configs';
import { UsuarioService } from '../database/usuario';
import { UUID } from '../database/uuid';
import { EndpointService } from '../database/endpoint';
import * as cipher from '../services/cipher/cipher';

export namespace TaskQueue {

  let queuePromise: Promise<kue.Queue>;

  export async function getQueue(): Promise<kue.Queue> {
    return queuePromise || (queuePromise = (async () => {
      const config = await ConfigurationService.getConfig();

      const queue = kue.createQueue();
      queue.setMaxListeners(config.update_queue_size + 5);
      return queue;
    })());
  }

  export function shutdown(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (queuePromise) {
        const queue = await queuePromise;
        queue.shutdown(2000, (err?: Error) => {
          if (err) { return reject(err); }
          queuePromise = null as any;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  export async function startRunner(): Promise<void> {
    const queue = await TaskQueue.getQueue();
    const config = await ConfigurationService.getConfig();

    queue.process('readnotas', config.update_queue_size, async (jobinfo, done) => {
      let strategy: IStrategy | undefined;
      try {

        const { userid }: JobNota = jobinfo.data;
        const usuario = (await UsuarioService.findById(UUID.from(userid)))!;
        const endpoint = (await EndpointService.getEndpointById(usuario.endpoint))!;
        const password = cipher.decrypt(usuario.password, config.cipher_pass);

        strategy = (await StrategyFactory.build(endpoint.strategy, endpoint!.url))!;
        await strategy.login(usuario.matricula, password);
        await NotasTask.updateRemote(strategy, usuario.matricula);
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

