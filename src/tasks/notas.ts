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

export function retrieveData(browser: QBrowser, matricula: string): Promise<JobNotaResult> {
    const jobresult = {
        browser: browser,
        notas: {
            alteradas: [],
            novas: []
        }
    };
    let alunoid;
    return <any> Usuario.find({ where: { matricula: matricula } })
        .then((user: any) => alunoid = user.id)
        .then(() => qdiarios.getDisciplinas(browser))
        .then(disciplinas => {
            let prom = Promise.resolve();
            disciplinas.forEach(disc => {
                prom = prom.then(() => Turma.findOne({ where: { codigo: disc.turma } })
                    .then(turma => {
                        if (!turma) {
                            return Turma.create({
                                codigo: disc.turma,
                                nome: 'Turma ' + disc.turma
                            })
                        }
                        return true;
                    })
                    .then(() => {
                        return Disciplina.findOne({ where: { codturma: disc.turma, nome: disc.nome, professor: disc.professor } })
                            .then((discdb: any) => {
                                if (!discdb) {
                                    return Disciplina.create({
                                            codturma: disc.turma,
                                            nome: disc.nome,
                                            professor: disc.professor
                                        })
                                        .then((res: any) => {
                                            return Usuario.findById(alunoid)
                                                .then((user: any) => {
                                                    return user.addDisciplina(res).then(() => res);
                                                });
                                        });
                                }
                                return discdb.id;
                            });
                    })
                    .then(discid => {
                        let prom = Promise.resolve();
                        disc.etapas.forEach(etapa => {
                            etapa.notas.forEach(nota => {
                                prom = prom.then(() => Nota.find({
                                    where: {
                                        descricao: nota.descricao
                                    }
                                }))
                                .then((notadb: any) => {
                                    if (!notadb) {
                                        return Nota.create({
                                            etapa: etapa.numero,
                                            descricao: nota.descricao,
                                            peso: nota.peso,
                                            notamaxima: nota.notamaxima,
                                            nota: nota.nota,
                                            disciplinaid: discid,
                                            userid: matricula
                                        }).then((novanota: any) => {
                                            return Usuario.findById(alunoid)
                                                .then((user: any) => {
                                                    jobresult.notas.novas.push(novanota.id);
                                                    return user.addNota(novanota).then(() => novanota);
                                                });
                                        })
                                    }
                                    if (nota.peso !== notadb.peso || nota.notamaxima !== notadb.notamaxima || nota.nota !== notadb.nota) {
                                        jobresult.notas.alteradas.push(notadb.id);
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
                            })   
                        })
                        return prom;
                    }));
            })
            return prom;
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
        .then(result => {
            console.log(result.notas);
            return result.browser.exit();
        })
        .then(results => done());
});

//cron.schedule('0 */2 * * * *', atualizaNotas);
setTimeout(() => atualizaNotas(), 1000);
