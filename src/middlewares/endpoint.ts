import { Usuario } from './../models/usuario';
import * as express from 'express';
import { Session } from '../models/session';

export interface UserData {
  session: Session;
}

export default async function (req: express.Request, res: express.Response, next: () => void) {
  const userdata: UserData = (req as any).userdata = ((req as any).userdata || {});
  const token = req.header('x-access-token') || req.query.token;
  if (!token) {
    return res.status(401)
      .json({
        success: false,
        message: 'Não autorizado'
      });
  }
  try {
    const ses = await Session.findById(token, { include: [Usuario] });
    if (!ses) {
      throw new Error();
    }
    userdata.session = ses;
    next();
  } catch {
    res.status(401)
      .json({
        success: false,
        message: 'Não autorizado'
      });
  }
}
