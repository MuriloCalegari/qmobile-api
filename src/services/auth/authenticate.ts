import { Usuario } from './../../models/usuario';
import * as qauth from '../../services/browser/qauth';
import * as quser from '../../services/browser/quser';
import { QError } from '../../services/errors/errors';
import * as configs from '../../configs';
import * as cipher from '../cipher/cipher';
import * as photo from '../photo/photo';
import * as notasJob from '../../tasks/notas';
import { QBrowser } from '../driver/webdriver';

async function insereBanco(endpoint: string, matricula: string, nome: string, pass: string): Promise<Usuario> {
  const password = cipher.cipher(pass, configs.cipher_pass);
  return await Usuario.create({
    matricula,
    nome,
    password,
    endpoint
  });
}

export async function login(endpoint: string, username: string, pass: string): Promise<Usuario> {

  let user = await Usuario.findOne({
    where: {
      matricula: username
    }
  });
  if (!user) {
    const browser = await qauth.login(endpoint, username, pass);
    const name = await quser.getName(browser)
    user = await insereBanco(endpoint, username, name, pass);
    const buffer = await quser.getPhoto(browser);
    await photo.process(buffer);
    await photo.savePhoto(buffer, user.id);
    await notasJob.retrieveData(browser, username);
    await browser.exit();
  }
  const hash = cipher.cipher(pass, configs.cipher_pass);
  if (user.password === hash) {
    return user;
  } else {
    throw new QError('Senha incorreta');
  }
}
