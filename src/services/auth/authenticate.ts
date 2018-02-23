import { StrategyType } from './../strategy/factory';
import { Usuario } from './../../models/usuario';
import { QError } from '../../services/errors/errors';
import * as configs from '../../configs';
import * as cipher from '../cipher/cipher';
import * as photo from '../photo/photo';
import { NotasTask } from '../../tasks/notas';
import { StrategyFactory } from '../strategy/factory';

async function insereBanco(endpoint: string, matricula: string, nome: string, pass: string): Promise<Usuario> {

  const password = cipher.crypt(pass, configs.cipher_pass);
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
    const strategy = (await StrategyFactory.build(StrategyType.QACADEMICO, endpoint))!;
    await strategy.login(username, pass);
    const name = await strategy.getFullName();
    user = await insereBanco(endpoint, username, name, pass);
    const buffer = await photo.process(
      await strategy.getProfilePicture()
    );
    await photo.savePhoto(buffer, user.id);
    await NotasTask.updateRemote(strategy, username);
    await strategy.release();
  }
  const decrypted = cipher.decrypt(user.password, configs.cipher_pass);
  if (decrypted === pass) {
    return user;
  } else {
    throw new QError('Senha incorreta');
  }
}
