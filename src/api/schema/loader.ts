import { UUID } from './../../database/uuid';
import * as DataLoader from 'dataloader';
import { UsuarioService } from '../../database/usuario';
import { EndpointService } from '../../database/endpoint';
import { StrategyFactory } from '../../services/strategy/factory';
import { NotasTask } from '../../tasks/notas';

export const HistoryLoader = new DataLoader<string, void>(
  ids => Promise.all(ids.map(async id => {

    const usuario = (await UsuarioService.findById(UUID.from(id)))!;
    if (!usuario.inicializado) {
      try {
        const [endpoint] = await Promise.all([
          EndpointService.getEndpointById(usuario.endpoint),
          UsuarioService.setInicializado(usuario.id!, true)
        ]);

        const strategy = (await StrategyFactory.prepareStrategy(endpoint!, usuario))!;
        await NotasTask.updateRemote(strategy, usuario.matricula, true);
      } catch (e) {
        /* istanbul ignore next: dificil de reproduzir */
        UsuarioService.setInicializado(usuario.id!, false).catch(() => { });
        throw e;
      }
    }

  }))
);
