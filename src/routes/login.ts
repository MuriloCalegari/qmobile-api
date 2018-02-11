import * as express from 'express';
import { QError, QSiteError } from '../services/errors/errors';
import * as authenticate from '../services/auth/authenticate';
import * as session from '../services/auth/session';
import * as notasJob from '../tasks/notas';
import endpoint, { UserData } from '../middlewares/endpoint';
import { QBrowser } from '../services/driver/webdriver';

const route = express.Router();

route.post('/login', async (req, res) => {
  const required = ['user', 'pass', 'endpoint'];
  if (required.some(key => !req.body[key])) {
    return res.status(400).json({
      success: false,
      message: 'Preencha todos os campos'
    });
  }
  const { username, pass, endpoint } = req.body;
  try {
    const user = await authenticate.login(endpoint, username, pass);
    const sessionid = await session.createSession(user.id);
    res.set('X-Access-Token', sessionid).json({
      success: true,
      name: user.nome
    });
  } catch (err) {
    const err500 = err instanceof QSiteError || err instanceof QError === false;
    res.status(err500 ? 500 : 400)
      .json({
        success: false,
        message: err500 ? 'Falha no servidor do QAcadêmico' : err.message
      })
  }
});

route.post('/logout', endpoint, (req, res) => {
  const userdata = (req as any).userdata as UserData;
  session.destroySession(userdata.session.id)
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
