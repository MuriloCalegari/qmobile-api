/// <reference path="definitions.d.ts" />

import * as orm from './models/orm';
import * as Nota from './models/nota';
import * as morgan from 'morgan';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import endpoint from './middlewares/endpoint';
import * as loginRoute from './routes/login';
import * as notasRoute from './routes/notas';
import * as disciplinasRoute from './routes/disciplinas';
require('./tasks/notas');

const app = express();

app.use(<any> morgan('dev'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.use('/auth', loginRoute);

app.use(endpoint);

app.use('/nota(s)?', notasRoute);
app.use('/disciplinas', disciplinasRoute);

orm.sync()
    .then(() => {
        app.listen(3010, () => {
            console.log("Servidor iniciado na porta 3010");
        });
    });
