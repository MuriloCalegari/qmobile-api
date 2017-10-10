/// <reference path="definitions.d.ts" />

import * as orm from './models/orm';
import * as Nota from './models/nota';
import * as morgan from 'morgan';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import endpoint from './middlewares/endpoint';
import * as loginRoute from './routes/login';
require('./tasks/notas');

const app = express();

app.use(morgan('dev'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(endpoint);

app.use('/auth', loginRoute);

orm.sync({ force: true })
    .then(() => {
        app.listen(3010, () => {
            console.log("Servidor iniciado na porta 3010");
        });
    });
