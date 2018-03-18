import * as colors from 'colors/safe';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { schema } from './schema';
import { DatabaseService } from '../database/database';
import { TaskQueue } from '../tasks/queue';
import * as cron from 'node-cron';
import { NotasTask } from '../tasks/notas';

(async () => {
  console.log(colors.green(`
    ___  __  __       _     _ _
   / _ \\|  \\/  | ___ | |__ (_) | ___
  | | | | |\\/| |/ _ \\| '_ \\| | |/ _ \\
  | |_| | |  | | (_) | |_) | | |  __/
   \\__\\_\\_|  |_|\\___/|_.__/|_|_|\\___|

 `));
 console.log(colors.green('Iniciando...'));

  await DatabaseService.createTables();
  await TaskQueue.startRunner();

  const PORT = 3002;

  const app = express();

  app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));

  app.get('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

  cron.schedule('*/2 * * * *', () => {
    NotasTask.scheduleUpdate();
  });

  app.listen(PORT, () => {
    console.log(colors.white('Here we go :)'));
  });
})().catch(err => {
  console.log(colors.red('Oh não! Houve um erro ao inicializar!'));
  console.error(err);
});

