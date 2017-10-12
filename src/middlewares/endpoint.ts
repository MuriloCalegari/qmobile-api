import * as express from 'express';
import * as Session from '../models/session';
import * as Usuario from '../models/usuario';

export default function(req: express.Request, res: express.Response, next: () => void) {
    const userdata = (<any>req).userdata = (<any>req).userdata || {};
    const token = req.header('x-access-token');
    if (!token) {
        return res.status(401)
                .json({
                    success: false,
                    message: 'Não autorizado'
                });
    }
    Session.findById(token, { include: [Usuario] })
        .then((ses: any) => {
            userdata.endpoint = ses.user.endpoint;
            userdata.userid = ses.user.id;
            next();
        })
        .catch(err => {
            return res.status(401)
                .json({
                    success: false,
                    message: 'Não autorizado'
                });
        })
}