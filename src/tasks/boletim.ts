import { UsuarioDto } from './../database/usuario';
import { IStrategy, RemoteBoletim } from './../services/strategy/factory';
import { Job } from 'kue';
import { TaskQueue } from './queue';
import { UsuarioService } from '../database/usuario';
import { BoletimService } from '../database/boletim';
import { DisciplinaService } from '../database/disciplina';

export namespace BoletimTask {

  export async function createJob(userid: string): Promise<Job> {
    const queue = await TaskQueue.getQueue();

    return queue.create('readboletim', { userid })
      .removeOnComplete(true).events(false).ttl(2.4e5 /* 4min */).save();
  }

  async function updateBoletim(usuario: UsuarioDto, { disciplina, data, ...boletim }: RemoteBoletim): Promise<void> {
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
      boletins.map(boletim => updateBoletim(usuario, boletim))
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

  export async function scheduleUpdate(): Promise<void> {
    const users = await UsuarioService.findAll();
    users.forEach(({ id }) => BoletimTask.createJob(id!.toString()));
  }

}
