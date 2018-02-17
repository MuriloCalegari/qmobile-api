import * as sequelize from 'sequelize';
import * as express from 'express';
import * as colors from 'colors/safe';
import * as fs from 'fs';
import * as path from 'path';
import { Spinner } from 'cli-spinner';
import { PHOTOS_FOLDER } from './constants';
const pjson = require('../package.json');

const spin = new Spinner('%s');
spin.start();

function bootstrap(): Promise<void> {
  console.log(colors.green(`
    ___  __  __       _     _ _
   / _ \\|  \\/  | ___ | |__ (_) | ___
  | | | | |\\/| |/ _ \\| '_ \\| | |/ _ \\
  | |_| | |  | | (_) | |_) | | |  __/
   \\__\\_\\_|  |_|\\___/|_.__/|_|_|\\___|

 `));
  console.log(colors.green('Inicializando versão ' + colors.white(pjson.version)));
  return new Promise<void>((resolve, reject) => {
    spin.setSpinnerTitle(colors.blue('%s Lendo configuração'));
    const configs = require('./configs');
    if (configs !== null && configs.cipher_pass && configs.cipher_pass === '123mudar') {
      console.warn(colors.yellow('O valor de ' + colors.bold('cipher_pass') + ' precisa ser alterado.'));
    }
    configs !== null ? resolve() : reject(new Error('Falha ao ler a configuração'));
  })
    .then(() => {
      spin.setSpinnerTitle(colors.blue('%s Inicializando banco de dados'));
      const orm: sequelize.Sequelize = require('./models/orm');
      require('./models/nota');
      return orm.sync();
    })
    .then(() => import('./tasks/notas'))
    /*.then(task =>
        new Promise((resolve, reject) => {
            spin.setSpinnerTitle(colors.blue('%s Atualizando dados dos usuários'));
            task.atualizaNotas()
                .then(users => {
                    if (users.length === 0) {
                        return resolve(task);
                    }
                    let listener = null;
                    task.queue.on('job complete', listener = function() {
                        task.queue.activeCount('readnotas', (err, total) => {
                            if (total == 0) {
                                task.queue.removeListener('job complete', listener);
                                resolve(task);
                            }
                        })
                    });
                })
                .catch(err => reject(err))
        })
        .then(() => {
            cron.schedule('0 *'+'/2 * * * *', () => task.atualizaNotas(), false);
        })
    )*/
    .then(() => new Promise<void>((resolve, reject) => {
      const configs = require('./configs');
      spin.setSpinnerTitle(colors.blue('%s Inicializando servidor'));
      const server: express.Express = require('./server');
      server.listen(configs.serverport, () => {
        resolve();
      }).on('error', err => reject(err));
    }));
}

bootstrap()
  .then(() => {
    const configs = require('./configs');
    spin.stop(true);
    console.log(colors.green(`Servidor inicializado na porta ${configs.serverport}`));
  })
  .catch(err => {
    spin.stop(true);
    console.error(colors.red('Falha ao inicializar servidor:'));
    console.error(err);
    process.exit(1);
  });
