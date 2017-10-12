import * as configs from '../configs';
import * as assert from 'assert';
import * as qauth from '../services/browser/qauth';
import * as quser from '../services/browser/quser';
import * as qdiarios from '../services/browser/qdiarios';
import { QBrowser } from '../services/driver/webdriver';
import { expect } from 'chai';

const cfg = configs.tests;

let browser: QBrowser = null;

describe('browser/qauth', () => {
    before(function() {
        if (cfg.endpoint === null) {
            this.skip();
        }
    });
    it('Logar com sucesso', () => {
        return qauth.login(cfg.endpoint, cfg.login, cfg.password)
            .then(b => browser = b);
    }).timeout(30000);
});

describe('browser/quser', () => {
    before(function() {
        if (browser === null) {
            this.skip();
        }
    });
    it('Pegar o nome correto', (done) => {
        quser.getName(browser)
            .then(name => {
                assert.equal(name, cfg.name);
                done();
            })
            .catch(err => {
                assert.ok(false, err.message);
                done();
            })
    }).timeout(10000);
})

describe('browser/qdiarios', () => {
    before(function() {
        if (browser === null) {
            this.skip();
        }
    });
    let disciplinas: qdiarios.Disciplina[];
    it('Ler disciplinas', () => {
        return qdiarios.getDisciplinas(browser)
            .then(res => disciplinas = res);
    }).timeout(10000);
    describe('Validar resultados', () => {
        it('Tem resultados', () => {
            assert.notEqual(disciplinas, null);
            expect(disciplinas).to.be.an('array').that.is.not.empty;
        });
        it('Validar disciplinas', () => {
            disciplinas.forEach(disciplina => {
                expect(disciplina).to.be.not.null;
                expect(disciplina).to.be.an('object');
                expect(disciplina).to.contain.keys('turma', 'nome', 'professor', 'etapas');
                expect(disciplina.turma).to.be.a('string');
                expect(disciplina.nome).to.be.a('string');
                expect(disciplina.professor).to.be.a('string');
                expect(disciplina.etapas).to.be.an('array');
            });
        });
        it('Validar etapas', () => {
            disciplinas.forEach(disciplina => {
                disciplina.etapas.forEach(etapa => {
                    expect(etapa).to.be.not.null;
                    expect(etapa).to.be.an('object');
                    expect(etapa).to.contain.keys('numero', 'notas');
                    expect(etapa.numero).to.be.a('number');
                    expect(etapa.notas).to.be.an('array');
                })
            });
        });
        it('Validar notas', () => {
            disciplinas.forEach(disciplina => {
                disciplina.etapas.forEach(etapa => {
                    etapa.notas.forEach(nota => {
                        expect(nota).to.be.not.null;
                        expect(nota).to.be.an('object');
                        expect(nota).to.contain.keys('descricao', 'peso', 'nota', 'notamaxima');
                        expect(nota.descricao).to.be.a('string');
                        expect(nota.peso).to.be.a('number');
                        expect(nota.nota).to.be.a('number');
                        expect(nota.notamaxima).to.be.a('number');
                    })
                })
            });
        })
    })
})
after(() => {
    if (browser !== null) {
        return browser.exit();
    }
})