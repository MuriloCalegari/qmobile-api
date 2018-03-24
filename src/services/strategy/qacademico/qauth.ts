const rsa = require('./lib/rsa.js');
import { QAcademicoStrategy } from './index';
import { LOGIN_PAGE, RSA_PAGE, FORM_PAGE } from '../../../constants';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as querystring from 'querystring';

export async function login(strategy: QAcademicoStrategy, username: string, password: string): Promise<void> {
  try {
    const keyRegex = /\"([a-zA-Z0-9]+)\"/g;
    const { options, endpoint } = strategy;
    await axios.get(endpoint + LOGIN_PAGE);

    const { data } = await axios.get(endpoint + RSA_PAGE, options);

    let matches;
    const keys: string[] = [];
    while (matches = keyRegex.exec(data)) {
      keys.push(matches[1]);
    }

    const key = new rsa.RSAKeyPair(
       keys[0],
       '',
       keys[1]
    );
    const payload = {
      LOGIN: rsa.encryptedString(key, username),
      SENHA: rsa.encryptedString(key, password),
      TIPO_USU: rsa.encryptedString(key, '1'),
      Submit: rsa.encryptedString(key, 'OK')
    };

    if (!Object.values(payload).every(Boolean)) {
      throw new Error('Falha no QAcademico');
    }

    const { data: pagina } = await axios.post(
      endpoint + FORM_PAGE,
      querystring.stringify(payload),
      options
    );
    const dom = cheerio.load(pagina);
    const titulo = dom('title').text();
    if (!titulo.toLowerCase().includes('bem vindo')) {
      throw new Error('Senha incorreta');
    }
  } catch (e) {
    if (e.message !== 'Senha incorreta') {
      try {
        await strategy.release(true);
      } catch { }
    }
    throw e;
  }
}
