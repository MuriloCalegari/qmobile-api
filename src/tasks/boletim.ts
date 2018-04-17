import { UsuarioDto } from './../database/usuario';
import { IStrategy, RemoteBoletim } from './../services/strategy/factory';
import { UsuarioService } from '../database/usuario';
import { BoletimService } from '../database/boletim';
import { DisciplinaService } from '../database/disciplina';

export namespace BoletimTask {

  export async function updateBoletim(usuario: UsuarioDto, { disciplina, data, ...boletim }: RemoteBoletim): Promise<void> {
    const disciplinaDto = await DisciplinaService.getDisciplinaByNome(usuario, data, disciplina);
    if (disciplinaDto) {
      await BoletimService.upsert({
        usuario_disciplina: disciplinaDto.ud,
        ...boletim
      });
    }
  }

  export async function updateAll(usuario: UsuarioDto, boletins: RemoteBoletim[]): Promise<void> {
    await Promise.all(
      boletins.map(boletim => BoletimTask.updateBoletim(usuario, boletim))
    );
  }

  export async function updateRemote(strategy: IStrategy, matricula: string, updatePast: boolean = false): Promise<void> {
    const usuario = await UsuarioService.findByMatricula(matricula);

    if (usuario) {
      const codigosPeriodos = await strategy.getPeriodos();
      if (!updatePast) {
        codigosPeriodos.splice(1, codigosPeriodos.length - 1);
      }
      await Promise.all(
        codigosPeriodos.map(async periodo => {

          const boletim = await strategy.getBoletim(periodo);
          await BoletimTask.updateAll(usuario, boletim);

        })
      );
    }
  }
}
