import * as cron from 'node-cron';

import * as queue from './queue';
import * as configs from '../configs';
import * as Nota from '../models/nota';
import * as Disciplina from '../models/disciplina';
import * as Turma from '../models/turma';
import * as Usuario from '../models/usuario';
import * as crypto from '../services/crypt/crypto';
import { QBrowser } from '../services/driver/webdriver';
import * as qauth from '../services/browser/qauth';
import * as qdiarios from '../services/browser/qdiarios';

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

export function createJob(userid: string, matricula: string, senha: string, endpoint: string) {
    return queue.create('readnotas', {
        userid: userid,
        matricula: matricula,
        senha: senha,
        endpoint: endpoint
    });
}

function createTurma(codigo: string, nome: string) {
    return Turma.findOne({ where: { codigo: codigo } })
        .then(turma => {
            if (!turma) {
                return Turma.create({
                    codigo: codigo,
                    nome: nome
                })
            }
            return true;
        });
}

function createDisciplina(codturma: string, nome: string, professor: string) {
    return Disciplina.findOne({ where: { codturma: codturma, nome: nome, professor: professor } })
        .then((discdb: any) => {
            if (!discdb) {
                return Disciplina.create({
                        codturma: codturma,
                        nome: nome,
                        professor: professor
                    })
                    .then((res: any) => res.id);
            }
            return discdb.id;
        });
}

function updateNota(objaluno: any, disciplina: qdiarios.Disciplina, etapa: qdiarios.Etapa, nota: qdiarios.Nota) {
    return Nota.find({
            where: {
                descricao: nota.descricao
            }
        })
        .then((notadb: any) => {
            if (!notadb) {
                return Nota.create({
                    etapa: etapa.numero,
                    descricao: nota.descricao,
                    peso: nota.peso,
                    notamaxima: nota.notamaxima,
                    nota: nota.nota,
                    disciplinaid: disciplina.id,
                    userid: objaluno.id
                })
                .then((novanota: any) => objaluno.addNota(novanota).then(() => novanota))
            }
            if (nota.peso !== notadb.peso || nota.notamaxima !== notadb.notamaxima || nota.nota !== notadb.nota) {
                return Nota.update({
                    nota: nota.nota,
                    notamaxima: nota.notamaxima,
                    peso: nota.peso
                },
                {
                    where: {
                        id: notadb.id
                    }
                });
            }
            return notadb;
        })
}

function updateEtapa(objaluno: any, disciplina: qdiarios.Disciplina, etapa: qdiarios.Etapa) {
    const proms = [];
    etapa.notas.forEach(nota => {
        proms.push(updateNota(objaluno, disciplina, etapa, nota));
    });
    return Promise.all(proms);
}

export function retrieveData(browser: QBrowser, matricula: string): Promise<JobNotaResult> {
    const jobresult = {
        browser: browser
    };
    let objaluno;
    return <any> Usuario.find({ where: { matricula: matricula } })
        .then((user: any) => objaluno = user)
        .then(() => qdiarios.getDisciplinas(browser))
        .then(disciplinas => {
            let sequencia = Promise.resolve();
            disciplinas.forEach(disc => {
                sequencia = sequencia
                    .then(() => createTurma(disc.turma, 'Turma ' + disc.turma))
                    .then(() => createDisciplina(disc.turma, disc.nome, disc.professor))
                    .then(discid => 
                        objaluno.hasDisciplina(discid)
                            .then(has => {
                                if (!has) {
                                    return objaluno.addDisciplina(discid)
                                        .then(() => discid);
                                }
                                return discid;
                            })
                    )
                    .then(discid => {
                        disc.id = discid;
                        const proms = [];
                        disc.etapas.forEach(etapa => {
                            proms.push(updateEtapa(objaluno, disc, etapa));
                        })
                        return <any> Promise.all(proms);
                    });
            })
            return sequencia;
        })
        .then(() => jobresult);
}

function atualizaNotas() {
    Usuario.all()
        .then((users: any[]) => {
            users.forEach(user => {
                const job = createJob(user.id, user.matricula, crypto.decrypt(user.password, configs.crypt_pass), user.endpoint);
                job.events(false);
                job.save();
            });
        });
}

queue.process('readnotas', 5, function (jobinfo, done) {
    const job: JobNota = jobinfo.data;
    qauth.login(job.endpoint, job.matricula, job.senha)
        .then(browser => retrieveData(browser, job.matricula))
        .then(result => result.browser.exit())
        .then(results => done());
});

//cron.schedule('0 */2 * * * *', atualizaNotas);
setTimeout(() => atualizaNotas(), 1000);
