import * as express from 'express';
import { QError, QSiteError } from '../services/errors/errors';
import * as authenticate from '../services/auth/authenticate';
import * as session from '../services/auth/session';
import * as notasJob from '../tasks/notas';
import endpoint from '../middlewares/endpoint';
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
    const result = await authenticate.login(endpoint, username, pass)
    if (result.newbie) {
      const browser = result.browser as QBrowser;
      await notasJob.retrieveData(browser, username)
      await browser.exit();
    }
    const sessionid = await session.createSession(result.userid)
    res.set('X-Access-Token', sessionid).json({
      success: true,
      name: result.name
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
