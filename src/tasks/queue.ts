import * as qauth from '../services/browser/qauth';
import { JobNota, NotasTask } from './notas';
import { QBrowser } from './../services/driver/qbrowser';
import * as kue from 'kue';
import * as configs from '../configs';

const queue = kue.createQueue();

queue.setMaxListeners(configs.update_queue_size + 5);

queue.process('readnotas', configs.update_queue_size, async (jobinfo, done) => {
  let browser: QBrowser | undefined;
  try {

    const { endpoint, matricula, senha }: JobNota = jobinfo.data;

    browser = await qauth.login(endpoint, matricula, senha);
    await NotasTask.updateRemote(browser, matricula);
    await browser.exit();
    done();

  } catch (e) {
    try {
      await browser!.exit(true);
    } catch { }
    done(e);
  }
});

export = queue;
