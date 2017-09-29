import * as express from 'express';

export default function(req: express.Request, res: express.Response, next: () => void) {
    req.userdata = {
        endpoint: 'http://qacademico.ifsul.edu.br/qacademico'
    };
    next();
}