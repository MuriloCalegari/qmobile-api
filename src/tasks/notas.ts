import * as queue from './queue';
import { Job } from 'kue';
import * as configs from '../configs';
import * as Nota from '../models/nota';
import * as Disciplina from '../models/disciplina';
import * as Usuario from '../models/usuario';
import * as cipher from '../services/cipher/cipher';
import { QBrowser } from '../services/driver/webdriver';
import * as qauth from '../services/browser/qauth';
import * as qdiarios from '../services/browser/qdiarios';
import * as Turma from '../models/turma';

interface JobNota {
  userid: string;
  matricula: string;
  senha: string;
  endpoint: string;
}

export interface JobNotaResult {
  browser: QBrowser,
  notas: {
    alteradas: string[],
    novas: string[]
  }
}

export function createJob(userid: string, matricula: string, senha: string, endpoint: string): Job {
  return queue.create('readnotas', { userid, matricula, senha, endpoint });
}

async function createTurma(codigo: string, nome: string): Promise<void> {
  const turma = await Turma.findOne({ where: { codigo } });
  if (!turma) {
    await Turma.create({ codigo, nome });
  }
}

async function createDisciplina(codturma: string, nome: string, professor: string): Promise<string> {
  const disc = (await Disciplina.findOne({ where: { codturma, nome, professor } })).toJSON();
  if (!disc) {
    const { id } = (await Disciplina.create(
      { codturma, nome, professor }
    )).toJSON();
    return id;
  }
  return disc.id;
}

async function updateNota(objaluno: any, disciplina: qdiarios.Disciplina, etapa: qdiarios.Etapa, nota: qdiarios.Nota): Promise<void> {
  const notadb = (await Nota.find({
    where: {
      descricao: nota.descricao
    }
  })).toJSON();
  if (!notadb) {
    const novanota = await Nota.create({
      etapa: etapa.numero,
      descricao: nota.descricao,
      peso: nota.peso,
      notamaxima: nota.notamaxima,
      nota: nota.nota,
      disciplinaid: disciplina.id,
      userid: objaluno.id
    });
    await objaluno.addNota(novanota);
  } else if (nota.peso !== notadb.peso || nota.notamaxima !== notadb.notamaxima || nota.nota !== notadb.nota) {
    const { notamaxima, peso } = nota;
    await Nota.update({
      nota: nota.nota,
      notamaxima, peso
    }, {
        where: {
          id: notadb.id
        }
      });
  }
}

async function updateEtapa(objaluno: any, disciplina: qdiarios.Disciplina, etapa: qdiarios.Etapa): Promise<void> {
  await Promise.all(
    etapa.notas.map(
      nota => updateNota(objaluno, disciplina, etapa, nota)
    )
  );
}

export async function retrieveData(browser: QBrowser, matricula: string): Promise<JobNotaResult> {
  const jobresult = {
    browser: browser
  };
  const objaluno = await Usuario.find({ where: { matricula: matricula } });
  const disciplinas = await qdiarios.getDisciplinas(browser);
  for (let disc of disciplinas) {
    await createTurma(disc.turma, 'Turma ' + disc.turma);
    const id = await createDisciplina(disc.turma, disc.nome, disc.professor);
    if (await objaluno.hasDisciplina(id)) {
      await objaluno.addDisciplina(id);
    }
    disc.id = id;
    await Promise.all(
      disc.etapas.map(etapa => updateEtapa(objaluno, disc, etapa))
    );
  }
  return jobresult as any;
}

export async function atualizaNotas(): Promise<void> {
  const users = await Usuario.all() as any;
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
