import * as express from 'express';
import { QError, QSiteError } from '../services/errors/errors';
import * as authenticate from '../services/auth/authenticate';
import * as session from '../services/auth/session';
import * as notasJob from '../tasks/notas';
import endpoint from '../middlewares/endpoint';

const route = express.Router();

route.post('/login', (req, res) => {
    if (!req.body.user || !req.body.pass || !req.body.endpoint) {
        return res.status(400).json({
            success: false,
            message: 'Preencha todos os campos'
        });
    }
    const username: string = req.body.user;
    const pass: string = req.body.pass;
    const endpoint: string = req.body.endpoint;
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
            return session.createSession(result.userid)
                .then(sessionid => {
                    res.set('X-Access-Token', sessionid).json({
                        success: true,
                        name: result.name
                    })
                })
        })
        .catch((err: QError) => {
            console.error(err);
            const err500 = err instanceof QSiteError || err instanceof QError === false;
            res.status(err500 ? 500 : 400)
                .json({
                    success: false,
                    message: err500 ? 'Falha no servidor do QAcadêmico' : err.message
                })
            }
        );
});

route.post('/logout', endpoint, (req, res) => {
    session.destroySession(req.userdata.sessionid)
        .then(() => {
            res.json({
                success: true
            })
        })
        .catch(() => {
            res.status(500).json({
                success: false
            })
        })
});

export = route;