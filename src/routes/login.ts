import * as express from 'express';
import { QError, QSiteError } from '../services/errors/errors';
import * as authenticate from '../services/auth/authenticate';
import * as session from '../services/auth/session';
import * as notasJob from '../tasks/notas';

const route = express.Router();

route.post('/login', (req, res) => {
    if (!req.body.user || !req.body.pass) {
        return res.status(400).json({
            success: false,
            message: 'Preencha todos os campos'
        });
    }
    const username: string = req.body.user;
    const pass: string = req.body.pass;
    const endpoint: string = (<any>req).userdata.endpoint;
    authenticate.login(endpoint, username, pass)
        .then(result => {
            if (result.newbie) {
                return notasJob.retrieveData(result.browser, username)
                    .then(() => result.browser.exit())
                    .then(() => result);
            }
            return result;
        })
        .then(result => {
            return session.createSession(result.userid).then(sessionid => {
                res.set('X-Access-Token', sessionid).json({
                    success: true,
                    name: result.name
                })
            })
        })
        .catch((err: QError) => {
            console.error(err);
            res.status(err instanceof QSiteError ? 500 : 400)
                .json({
                    success: false,
                    message: err instanceof QSiteError ? 'Falha no servidor do QAcadêmico' : err.message
                })
            }
        );
});

export = route;