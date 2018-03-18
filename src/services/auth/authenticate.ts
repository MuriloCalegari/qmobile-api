import { UsuarioDto } from './../../database/usuario';
import { StrategyType } from './../strategy/factory';
import { QError } from '../../services/errors/errors';
import * as cipher from '../cipher/cipher';
import * as photo from '../photo/photo';
import { StrategyFactory } from '../strategy/factory';
import { ConfigurationService } from '../../configs';
import { UsuarioService } from '../../database/usuario';
import { EndpointService } from '../../database/endpoint';

export async function login(endpoint: string, matricula: string, password: string): Promise<[boolean, UsuarioDto]> {
  const { cipher_pass } = await ConfigurationService.getConfig();
  const endpointDto = await EndpointService.getEndpointByUrl(endpoint);
  if (!endpointDto) {
    throw new Error('Endpoint não homologado');
  }

  let user = await UsuarioService.findByMatricula(matricula);
  let novo = false;
  if (!user) {
    novo = true;
    const strategy = (await StrategyFactory.build(endpointDto.strategy, endpoint))!;
    await strategy.login(matricula, password);

    const nome = await strategy.getFullName();
    const ciphered = cipher.crypt(password, cipher_pass);
    user = await UsuarioService.create({
      matricula,
      nome,
      password: ciphered,
      endpoint: endpointDto.id!
    });

    const buffer = await photo.process(
      await strategy.getProfilePicture()
    );
    await photo.savePhoto(buffer, user.id!.toString());

    await strategy.release();

  }
  const decrypted = cipher.decrypt(user.password, cipher_pass);
  if (decrypted === password) {
    return [novo, user];
  } else {
    throw new QError('Senha incorreta');
  }
}
