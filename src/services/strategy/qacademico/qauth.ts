import * as rsa from '@qutils/barrett-rsa';
import { QAcademicoStrategy } from './index';
import { LOGIN_PAGE, RSA_PAGE, FORM_PAGE } from '../../../constants';
import * as cheerio from 'cheerio';

export async function login(strategy: QAcademicoStrategy, username: string, password: string): Promise<void> {
  try {
    const keyRegex = /\"([a-zA-Z0-9]+)\"/g;
    const { endpoint } = strategy;

    const data = await strategy.getUrl(endpoint + RSA_PAGE);

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

    /* istanbul ignore next: dificil de reproduzir */
    if (!Object.values(payload).every(Boolean)) {
      throw new Error('Falha no QAcademico');
    }

    const pagina = await strategy.postUrl(endpoint + FORM_PAGE, payload);
    const dom = cheerio.load(pagina, { decodeEntities: false });
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
