import * as express from 'express';
import * as http from 'http';
import * as path from 'path';
import * as bodyParser from 'body-parser';

const assets = path.join(__dirname, 'assets');

export interface ServerState {
  allowLogin: boolean;
  loggedIn: boolean;
  loginBody?: any | undefined;
}

export class PocketServer {

  private app?: express.Application;
  private server?: http.Server;
  state: ServerState;

  port: number;

  private constructor() {
    this.port = 9595;
    this.state = {
      allowLogin: true,
      loggedIn: false
    };
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.app = express();
      this.setup();
      this.server = this.app.listen(this.port, (err: Error) => {
        if (err) { return reject(err); }
        resolve();
      });
    });
  }

  stop(): Promise<void> {
    return new Promise(resolve => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  reset(): void {
    this.state = {
      allowLogin: true,
      loggedIn: false
    };
  }

  private setup() {
    const { app } = this;
    if (app) {
      app.use(bodyParser.urlencoded({ extended: false }));
      app.use('/index.asp', (req, res) => {
        const rotas = {
          1: 'login_fail.html',
          1001: 'login.html'
        };
        const rotas_logado = {
          2071: 'diarios.html',
          2032: 'boletim.html',
          2000: 'home.html'
        };
        const type = parseInt(req.query.t, 10) || 0;

        if (rotas[type]) {

          res.sendFile(path.join(assets, rotas[type]));
        } else if (rotas_logado[type]) {

          if (this.state.loggedIn) {
            res.sendFile(path.join(assets, rotas_logado[type]));
          } else {
            res.redirect('/index.asp?t=1');
          }

        } else {

          res.status(404).end('fail');

        }
      });
      app.get('/lib/rsa/gerador_chaves_rsa.asp', (req, res) => {
        res.sendFile(path.join(assets, 'rsa.html'));
      });
      app.get('/user.png', (_, res) =>
        res.sendFile(path.join(assets, 'user.png'))
      );
      app.get('/lib/sair.asp', (_, res) => {
        this.state.loggedIn = false;
        res.redirect('/index.asp?t=1001');
      });
      app.post('/lib/validalogin.asp', (req, res) => {
        this.state.loginBody = { ...req.body };
        if (this.state.allowLogin) {
          this.state.loggedIn = true;
          res.redirect('/index.asp?t=2000');
        } else {
          res.redirect('/index.asp?t=1');
        }
      });
    }
  }

  private static inst?: PocketServer;

  static getInstance(): PocketServer {
    return this.inst || (this.inst = new PocketServer());
  }

}
