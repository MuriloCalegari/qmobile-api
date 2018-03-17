import { UsuarioDto, UsuarioService } from './../database/usuario';
import { UUID } from './../database/uuid';
import {
  NumeroEtapa,
  RemoteNota,
  RemoteEtapa,
  RemoteDisciplina,
  IStrategy
} from './../services/strategy/factory';
import { Job } from 'kue';
import { TaskQueue } from './queue';
import { NotaService } from '../database/nota';
import { DisciplinaService } from '../database/disciplina';
import { DisciplinaProfessorService } from '../database/disciplina_professor';
import { ProfessorService } from '../database/professor';
import { UsuarioDisciplinaService } from '../database/usuario_disciplina';

export interface JobNota {
  userid: string;
}

export interface JobNotaResult {
  notas: {
    alteradas: UUID[],
    novas: UUID[]
  };
}

export type NotaState = 'alterada' | 'nova' | 'normal';

export type NotaUpdate = [UUID, NotaState];

export namespace NotasTask {

  export async function createJob(userid: string): Promise<Job> {
    const queue = await TaskQueue.getQueue();

    return queue.create('readnotas', { userid })
      .removeOnComplete(true).events(false).ttl(2.4e5 /* 4min */).save();
  }


  export async function updateNota(
    usuario_disciplina: number,
    etapa: NumeroEtapa, nota: RemoteNota
  ): Promise<NotaUpdate> {
    const [created, notadb] = await NotaService.findOrCreate({
      ...nota,
      etapa,
      usuario_disciplina
    });
    const diffs = ['peso', 'notamaxima', 'nota'];
    if (created) {
      return [notadb.id!, 'nova'];
    } else if (diffs.some(key => nota[key] !== notadb[key])) {
      const { descricao, ...update } = nota;
      await NotaService.update(notadb.id!, update);
      return [notadb.id!, 'alterada'];
    } else {
      return [notadb.id!, 'normal'];
    }
  }

  export function updateEtapa(usuario_disciplina: number, { notas, numero }: RemoteEtapa): Promise<NotaUpdate[]> {
    return Promise.all(
      notas.map(
        nota => NotasTask.updateNota(usuario_disciplina, numero, nota)
      )
    );
  }

  export async function updateDisciplina(
    usuario: UUID, endpoint: UUID, { etapas, ...disciplina }: RemoteDisciplina
  ): Promise<NotaUpdate[]> {

    const [, disciplinaDto] = await DisciplinaService.findOrCreate({
      nome: disciplina.nome,
      endpoint
    });
    const [, professorDto] = await ProfessorService.findOrCreate({
      nome: disciplina.professor,
      endpoint
    });
    const [, dpDto] = await DisciplinaProfessorService.findOrCreate({
      professor: professorDto.id!,
      disciplina: disciplinaDto.id!,
      turma: disciplina.turma,
      periodo: disciplina.periodo
    });

    const [, udDto] = await UsuarioDisciplinaService.findOrCreate({
      disciplina_professor: dpDto.id!,
      usuario
    });

    const all = await Promise.all(
      etapas.map(
        etapa => NotasTask.updateEtapa(udDto.id!, etapa)
      )
    );

    return all.reduce((ac, val) => ac.concat(val), []);
  }

  export async function updateAll(usuario: UsuarioDto, disciplinas: RemoteDisciplina[]): Promise<JobNotaResult> {

    const changes: NotaUpdate[][] = await Promise.all(
      disciplinas.map(disc =>
        NotasTask.updateDisciplina(usuario.id!, usuario.endpoint!, disc)
      )
    );

    const flatten = changes.reduce((ac, val) => ac.concat(val), []);
    return {
      notas: {
        alteradas: flatten
          .filter(([_, state]) => state === 'alterada')
          .map(([nota]) => nota),
        novas: flatten
          .filter(([_, state]) => state === 'nova')
          .map(([nota]) => nota),
      }
    };
  }

  export async function updateRemote(strategy: IStrategy, matricula: string, updatePast: boolean = false): Promise<JobNotaResult | null> {
    const usuario = await UsuarioService.findByMatricula(matricula);

    if (usuario) {
      const periodos = await strategy.getPeriodos();
      if (updatePast) {
        for (const periodo of periodos) {
          const { disciplinas } = await strategy.getPeriodo(periodo);
          await NotasTask.updateAll(usuario, disciplinas);
        }
      } else {
        const { disciplinas } = await strategy.getPeriodo(periodos[0]);
        await NotasTask.updateAll(usuario, disciplinas);
      }
    }

    return null;
  }

  export async function scheduleUpdate(): Promise<void> {
    const users = await UsuarioService.findAll();
    users.forEach(({ id }) => createJob(id!.toString()));
  }

}
