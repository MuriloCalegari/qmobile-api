import {
  NumeroEtapa,
  RemoteNota,
  RemoteEtapa,
  RemoteDisciplina,
  IStrategy
} from './../services/strategy/factory';
import { Usuario } from './../models/usuario';
import { Disciplina } from './../models/disciplina';
import { Job } from 'kue';
import * as configs from '../configs';
import * as cipher from '../services/cipher/cipher';
import { Nota } from '../models/nota';
import { TaskQueue } from './queue';

export interface JobNota {
  userid: string;
  matricula: string;
  senha: string;
  endpoint: string;
}

export interface JobNotaResult {
  notas: {
    alteradas: Nota[],
    novas: Nota[]
  };
}

export type NotaState = 'alterada' | 'nova' | 'normal';

export type NotaUpdate = [Nota, NotaState];

export namespace NotasTask {

  export function createJob(userid: string, matricula: string, senha: string, endpoint: string): Job {
    return TaskQueue.getQueue()
      .create('readnotas', { userid, matricula, senha, endpoint })
      .removeOnComplete(true).events(false).ttl(2.4e5 /* 4min */).save();
  }


  export async function updateNota(
    aluno: Usuario, disciplinaid: string,
    numetapa: NumeroEtapa, { id, periodo, ...nota }: RemoteNota
  ): Promise<NotaUpdate> {
    const [notadb, created] = await Nota.findOrCreate({
      where: {
        descricao: nota.descricao
      },
      defaults: {
        etapa: numetapa,
        ...nota,
        disciplinaid,
        userid: aluno.id
      }
    });
    const diffs = ['peso', 'notamaxima', 'nota'];
    if (created) {
      await aluno.$add('notas', notadb);
      return [notadb, 'nova'];
    } else if (diffs.some(key => nota[key] !== notadb.get(key))) {
      const { descricao, ...update } = nota;
      await notadb.update({ ...update });
      return [notadb, 'alterada'];
    } else {
      return [notadb, 'normal'];
    }
  }

  export function updateEtapa(aluno: Usuario, disciplinaid: string, { notas, numero }: RemoteEtapa): Promise<NotaUpdate[]> {
    return Promise.all(
      notas.map(
        nota => NotasTask.updateNota(aluno, disciplinaid, numero, nota)
      )
    );
  }

  export async function updateDisciplina(aluno: Usuario, disciplina: RemoteDisciplina): Promise<NotaUpdate[]> {
    const { id, etapas, ...rdisc } = disciplina;

    const [nova] = await Disciplina.findOrCreate({
      where: { ...rdisc },
      defaults: {
        ...rdisc
      }
    });
    if (!await aluno.$has('disciplinas', nova)) {
      await aluno.$add('disciplinas', nova);
    }

    disciplina.id = nova.id;
    const all = await Promise.all(
      etapas.map(
        etapa => NotasTask.updateEtapa(aluno, disciplina.id!, etapa)
      )
    );

    return all.reduce((ac, val) => ac.concat(val), []);
  }

  export async function updateAll(aluno: Usuario, disciplinas: RemoteDisciplina[]): Promise<JobNotaResult> {

    const changes: NotaUpdate[][] = await Promise.all(
      disciplinas.map(disc =>
        NotasTask.updateDisciplina(aluno, disc)
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
    const aluno = await Usuario.findOne({ where: { matricula } });
    console.log({ aluno });

    if (aluno) {
      const periodos = await strategy.getPeriodos();
      if (updatePast) {
        for (const periodo of periodos) {
          const { disciplinas } = await strategy.getPeriodo(periodo);
          await updateAll(aluno, disciplinas);
        }
      } else {
        const { disciplinas } = await strategy.getPeriodo(periodos[0]);
        await updateAll(aluno, disciplinas);
      }
    }

    return null;
  }

  export async function scheduleUpdate(): Promise<void> {
    const users = await Usuario.all();
    users.forEach(({ id, matricula, password, endpoint }) => {
      const job = createJob(
        id,
        matricula,
        cipher.decrypt(password, configs.cipher_pass),
        endpoint
      );
    });
  }

}
