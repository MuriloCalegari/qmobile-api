import { Usuario } from './../models/usuario';
import { Disciplina } from './../models/disciplina';
import { Turma } from './../models/turma';
import * as queue from './queue';
import { Job } from 'kue';
import * as configs from '../configs';
import * as cipher from '../services/cipher/cipher';
import { QBrowser } from '../services/driver/webdriver';
import * as qauth from '../services/browser/qauth';
import * as qdiarios from '../services/browser/qdiarios';
import { Nota } from '../models/nota';

interface JobNota {
  userid: string;
  matricula: string;
  senha: string;
  endpoint: string;
}

export interface JobNotaResult {
  browser: QBrowser,
  notas: {
    alteradas: Nota[],
    novas: Nota[]
  }
}

type NotaState = 'alterada' | 'nova' | 'normal';

type NotaUpdate = [Nota, NotaState];

export function createJob(userid: string, matricula: string, senha: string, endpoint: string): Job {
  return queue.create('readnotas', { userid, matricula, senha, endpoint });
}


async function updateNota(aluno: Usuario, disciplina: qdiarios.QDisciplina, etapa: qdiarios.QEtapa, { id, ...nota }: qdiarios.QNota): Promise<NotaUpdate> {
  const [notadb, created] = await Nota.findOrCreate({
    where: {
      descricao: nota.descricao
    },
    defaults: {
      etapa: etapa.numero,
      ...nota,
      disciplinaid: disciplina.id,
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

async function updateEtapa(aluno: Usuario, disciplina: qdiarios.QDisciplina, etapa: qdiarios.QEtapa): Promise<NotaUpdate[]> {
  return await Promise.all(
    etapa.notas.map(
      nota => updateNota(aluno, disciplina, etapa, nota)
    )
  );
}

export async function retrieveData(browser: QBrowser, matricula: string): Promise<JobNotaResult> {
  const aluno = await Usuario.findById(matricula);
  const changes: NotaUpdate[][] = [];
  if (aluno) {
    const disciplinas = await qdiarios.getDisciplinas(browser);
    for (let disc of disciplinas) {

      await Turma.findOrCreate({
        where: { codigo: disc.turma },
        defaults: {
          codigo: disc.turma,
          nome: `Turma ${disc.turma}`
        }
      });

      const { id, etapas, ...rdisc } = disc;
      const [nova] = await Disciplina.findOrCreate({
        where: { ...rdisc },
        defaults: { ...rdisc }
      })

      if (await aluno.$has('disciplinas', nova)) {
        await aluno.$add('disciplinas', nova);
      }
      disc.id = nova.id;
      const res = (await Promise.all(
        disc.etapas.map(etapa => updateEtapa(aluno, disc, etapa))
      )).reduce((ac, val) => ac.concat(val), []);
      changes.push(res);
    }
  }
  const flatten = changes.reduce((ac, val) => ac.concat(val), []);
  return {
    browser,
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

export async function atualizaNotas(): Promise<void> {
  const users = await Usuario.all();
  users.forEach(user => {
    const job = createJob(user.id, user.matricula, cipher.decipher(user.password, configs.cipher_pass), user.endpoint)
      .removeOnComplete(true).events(false).ttl(2.4e5 /* 4min */).save();
  });
}

queue.process('readnotas', configs.update_queue_size, async (jobinfo, done) => {
  const job: JobNota = jobinfo.data;

  const browser = await qauth.login(job.endpoint, job.matricula, job.senha);
  await retrieveData(browser, job.matricula);
  await browser.exit();
  done();
});

export { queue };
