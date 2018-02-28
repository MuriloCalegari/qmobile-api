import { Usuario } from './../../database/usuario';
import { StrategyType } from './../strategy/factory';
import { QError } from '../../services/errors/errors';
import * as cipher from '../cipher/cipher';
import * as photo from '../photo/photo';
import { NotasTask } from '../../tasks/notas';
import { StrategyFactory } from '../strategy/factory';
import { ConfigurationService } from '../../configs';
import { UsuarioService } from '../../database/usuario';

async function insereBanco(endpoint: string, matricula: string, nome: string, pass: string): Promise<Usuario> {

  const { cipher_pass } = await ConfigurationService.getConfig();

  const password = cipher.crypt(pass, cipher_pass);
  const user = {
    matricula,
    nome,
    password,
    endpoint
  };
  const _id =  await UsuarioService.createUser(user);
  return { _id, ...user };
}

export async function login(endpoint: string, username: string, pass: string): Promise<Usuario> {
  const { cipher_pass } = await ConfigurationService.getConfig();

  let user = await UsuarioService.getUserByMatricula(username);
  if (!user) {

    const strategy = (await StrategyFactory.build(StrategyType.QACADEMICO, endpoint))!;
    await strategy.login(username, pass);
    const name = await strategy.getFullName();
    user = await insereBanco(endpoint, username, name, pass);
    const buffer = await photo.process(
      await strategy.getProfilePicture()
    );
    await photo.savePhoto(buffer, user._id!.toHexString());
    await NotasTask.updateRemote(strategy, username);
    await strategy.release();

  }
  const decrypted = cipher.decrypt(user.password, cipher_pass);
  if (decrypted === pass) {
    return user;
  } else {
    throw new QError('Senha incorreta');
  }
}
