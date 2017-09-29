/// <reference path="definitions.d.ts" />

import * as orm from './models/orm';

import * as express from 'express';
import * as bodyParser from 'body-parser';
import endpoint from './middlewares/endpoint';
import * as loginRoute from './routes/login';

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(endpoint);

app.use('/auth', loginRoute);

app.listen(3010);