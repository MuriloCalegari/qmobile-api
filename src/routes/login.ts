import * as express from 'express';
import { QError, QSiteError } from '../services/errors/errors';
import * as authenticate from '../services/auth/authenticate';

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
    authenticate.login((<any>req).userdata.endpoint, username, pass)
        .then(result => 
            res.set('X-Access-Token', result.sessionid).json({
                success: true,
                name: result.name
            })
        )
        .catch((err: QError) => 
            res.status(err instanceof QSiteError ? 500 : 400)
                .json({
                    success: false,
                    message: err instanceof QSiteError ? 'Falha no servidor do QAcadêmico' : err.message
                })
        );
});

export = route;