import { Usuario } from './../../models/usuario';
import * as qauth from '../../services/browser/qauth';
import * as quser from '../../services/browser/quser';
import { QError } from '../../services/errors/errors';
import * as configs from '../../configs';
import * as cipher from '../cipher/cipher';
import * as photo from '../photo/photo';
import { QBrowser } from '../driver/webdriver';

function insereBanco(endpoint: string, matricula: string, nome: string, pass: string): Promise<Usuario> {
  const password = cipher.cipher(pass, configs.cipher_pass);
  return Usuario.create({
    matricula,
    nome,
    password,
    endpoint
  }) as any as Promise<Usuario>;
}

export interface LoginResult {
  newbie: boolean;
  name: string;
  userid: string;
  browser?: QBrowser
}
export async function login(endpoint: string, username: string, pass: string): Promise<LoginResult> {
  let res: LoginResult = {
    newbie: false,
    name: '',
    userid: ''
  }
  let user = await Usuario.findOne({
    where: {
      matricula: username
    }
  });
  if (!user) {
    res.newbie = true;
    res.browser = await qauth.login(endpoint, username, pass);
    res.name = await quser.getName(res.browser)
    user = await insereBanco(endpoint, username, res.name, pass)
    const buffer = await quser.getPhoto(res.browser)
    await photo.process(buffer);
    await photo.savePhoto(buffer, user.id);
  }
  const hash = cipher.cipher(pass, configs.cipher_pass);
  if (user.password === hash) {
    res.name = user.nome;
    res.userid = user.id;
    return res;
  } else {
    throw new QError('Senha incorreta');
  }
}
