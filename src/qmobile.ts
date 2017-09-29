/// <reference path="definitions.d.ts" />

import * as express from 'express';
import * as bodyParser from 'body-parser';
import endpoint from './middlewares/endpoint';
import * as qauth from './services/browser/qauth';
import * as quser from './services/browser/quser';
import * as qdiarios from './services/browser/qdiarios';
import * as webdriver from './services/driver/webdriver';
import * as fs from 'fs';
import * as path from 'path';

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(endpoint);

app.listen(3010);