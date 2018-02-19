import { QBrowser } from './../services/driver/qbrowser';
import { Disciplina } from './../models/disciplina';
import { Nota } from './../models/nota';
import { Usuario } from './../models/usuario';
import * as auth from '../services/auth/authenticate';
import * as qauth from '../services/browser/qauth';
import * as qdiarios from '../services/browser/qdiarios';
import * as queue from './queue';
import * as cipher from '../services/cipher/cipher';
import { Turma } from '../models/turma';
import { NotasTask } from './notas';

describe('NotasTask', () => {

  let usuario: Usuario;

  function limpar() {
    return Promise.all(
      [
        Nota,
        Disciplina,
        Turma
      ].map(mod => mod.truncate({ force: true, cascade: true }))
    );
  }

  beforeAll(async done => {
    spyOn(NotasTask, 'updateRemote').and.returnValue(
      Promise.resolve()
    );
    Promise.all([
      limpar(),
      (async () => {
        usuario = await auth.login('http://localhost:9595', 'test', 'pass');
        (NotasTask.updateRemote as jasmine.Spy).and.callThrough();
      })()
    ]
    ).then(done).catch(done.fail);
  });

  describe('updateDisciplina()', () => {

    beforeEach(() => {
      spyOn(NotasTask, 'updateEtapa').and.returnValue(
        Promise.resolve([[{ nota: 1 }, 'nova']])
      );
    });

    it('deve criar turma', async done => {
      try {
        await NotasTask.updateDisciplina(usuario, {
          turma: 'turmatst',
          nome: 'Programação',
          professor: 'John Doe',
          etapas: []
        });
        const turma = await Turma.findById('turmatst');
        expect(turma).toBeTruthy();
        expect(turma!.nome).toBe('Turma turmatst');
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('deve criar disciplina', async done => {
      try {
        await NotasTask.updateDisciplina(usuario, {
          turma: 'turmatst',
          nome: 'Programação 2',
          professor: 'John Doe',
          etapas: []
        });
        const disciplina = (await Disciplina.find({ where: { nome: 'Programação 2' } }))!;
        expect(disciplina).toBeTruthy();
        expect(disciplina.nome).toBe('Programação 2');
        expect(disciplina.professor).toBe('John Doe');
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('deve fazer as relações', async done => {
      try {
        await NotasTask.updateDisciplina(usuario, {
          turma: 'turmatst2',
          nome: 'Programação 3',
          professor: 'John Doe',
          etapas: []
        });

        const disciplina = (await Disciplina.find({ where: { nome: 'Programação 3' } }))!;
        const turma = (await Turma.findById('turmatst2'))!;

        expect(await turma.$has('disciplinas', disciplina)).toBeTruthy();
        expect(await usuario.$has('disciplinas', disciplina)).toBeTruthy();
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('deve manter apenas uma relação', async done => {
      try {
        await limpar();
        const disc = {
          turma: 'turmatst2',
          nome: 'Programação',
          professor: 'John Doe',
          etapas: []
        };
        await NotasTask.updateDisciplina(usuario, disc);
        await NotasTask.updateDisciplina(usuario, disc);

        const disciplina = (await Disciplina.find({ where: { nome: 'Programação' } }))!;
        const turma = (await Turma.findById('turmatst2'))!;

        expect(await turma.$count('disciplinas') as any).toBe(1);
        expect(await usuario.$count('disciplinas') as any).toBe(1);
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('deve atualizar as etapas', async done => {
      try {
        await NotasTask.updateDisciplina(usuario, {
          turma: 'turmatst2',
          nome: 'Programação 4',
          professor: 'John Doe',
          etapas: [{ numero: 1, notas: [] }, { numero: 2, notas: [] }]
        });

        const disciplina = (await Disciplina.find({ where: { nome: 'Programação 4' } }))!;

        expect(NotasTask.updateEtapa).toHaveBeenCalledWith(
          usuario,
          disciplina.id,
          { numero: 1, notas: [] }
        );
        expect(NotasTask.updateEtapa).toHaveBeenCalledWith(
          usuario,
          disciplina.id,
          { numero: 2, notas: [] }
        );
        done();
      } catch (e) {
        done.fail(e);
      }
    });

  });

  describe('updateEtapa()', () => {

    beforeEach(() => {
      spyOn(NotasTask, 'updateNota').and.returnValue(
        Promise.resolve([{ nota: 1 }, 'nova'])
      );
    });

    it('deve atualizar todas as notas da etapa', async done => {
      try {
        await NotasTask.updateEtapa(
          usuario,
          'tst',
          {
            numero: 1,
            notas: [{ nota: 1 }, { nota: 2 }] as any
          }
        );
        expect(NotasTask.updateNota).toHaveBeenCalledWith(usuario, 'tst', 1, { nota: 1 });
        expect(NotasTask.updateNota).toHaveBeenCalledWith(usuario, 'tst', 1, { nota: 2 });
        done();
      } catch (e) {
        done.fail(e);
      }
    });

  });

  describe('updateNota()', () => {

    let disciplinaid: string;

    beforeAll(async done => {
      try {
        const [disciplina] = await Disciplina.findOrCreate({
          where: {},
          defaults: {
            nome: 'Programação',
            professor: 'John Doe'
          }
        });
        disciplinaid = disciplina.id;
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('deve criar nota', async done => {
      try {
        const dados = {
          descricao: 'prova',
          peso: 10,
          notamaxima: 10,
          nota: 9
        };
        await NotasTask.updateNota(
          usuario,
          disciplinaid,
          1,
          dados
        );
        const nota = (await Nota.find({ where: { descricao: 'prova' } }))!;
        expect(nota).toBeTruthy();
        expect(nota).toEqual(jasmine.objectContaining(dados as any));
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('não deve duplicar notas', async done => {
      try {
        const criar = () => NotasTask.updateNota(
          usuario,
          disciplinaid,
          1,
          {
            descricao: 'prova 2',
            peso: 10,
            notamaxima: 10,
            nota: 9
          }
        );
        await criar();
        await criar();
        const notas = (await Nota.findAll({ where: { descricao: 'prova 2' } }))!;
        expect(notas.length).toBe(1);
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('deve manter apenas uma relação', async done => {
      try {
        await Nota.truncate();
        const criar = () => NotasTask.updateNota(
          usuario,
          disciplinaid,
          1,
          {
            descricao: 'prova 3',
            peso: 10,
            notamaxima: 10,
            nota: 9
          }
        );
        await criar();
        await criar();
        const notas = await usuario.$get<Nota>('notas') as Nota[];
        expect(notas.length).toBe(1);
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('deve atualizar a nota', async done => {
      try {
        const criar = (nota: number) => NotasTask.updateNota(
          usuario,
          disciplinaid,
          1,
          {
            descricao: 'prova 4',
            peso: 10,
            notamaxima: 10,
            nota
          }
        );
        const ret1 = await criar(6);
        const ret2 = await criar(9);
        const ret3 = await criar(9);
        const notadb = (await Nota.find({ where: { descricao: 'prova 4' } }))!;

        expect(notadb.nota).toBe(9);
        expect(ret1).toEqual([jasmine.any(Nota), 'nova'] as any);
        expect(ret2).toEqual([jasmine.any(Nota), 'alterada'] as any);
        expect(ret3).toEqual([jasmine.any(Nota), 'normal'] as any);
        done();
      } catch (e) {
        done.fail(e);
      }
    });

  });

  describe('updateAll()', () => {

    it('deve filtrar os resultados retornados pelo updateDisciplina()', async done => {
      try {
        let i = 0;
        spyOn(NotasTask, 'updateDisciplina').and.callFake(async () => {
          i++;
          switch (i) {
            case 1:
              return [[{ tst: 1 }, 'nova'], [{ tst: 4 }, 'normal']];
            case 2:
              return [[{ tst: 2 }, 'alterada'], [{ tst: 5 }, 'nova']];
            case 3:
              return [[{ tst: 3 }, 'normal'], [{ tst: 6 }, 'alterada']];
          }
        });

        const ret = await NotasTask.updateAll(usuario, [
          { disciplina: 1 },
          { disciplina: 2 },
          { disciplina: 3 },
        ] as any);
        expect(NotasTask.updateDisciplina).toHaveBeenCalledTimes(3);
        expect(NotasTask.updateDisciplina).toHaveBeenCalledWith(usuario, { disciplina: 1 });
        expect(NotasTask.updateDisciplina).toHaveBeenCalledWith(usuario, { disciplina: 2 });
        expect(NotasTask.updateDisciplina).toHaveBeenCalledWith(usuario, { disciplina: 3 });
        expect(ret).toEqual({
          notas: {
            alteradas: [{ tst: 2 }, { tst: 6 }] as any,
            novas: [{ tst: 1 }, { tst: 5 }] as any,
          }
        });
        done();
      } catch (e) {
        console.error(e);
        done.fail(e);
      }
    });

  });

  describe('updateRemote()', () => {

    let browser: QBrowser;
    beforeAll(async done => {
      try {
        browser = await qauth.login('http://localhost:9595', 'test', 'pass');
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    beforeEach(() => {
      spyOn(NotasTask, 'updateAll').and.returnValue(Promise.resolve({ tst: 1 }));
      spyOn(qdiarios, 'getDisciplinas').and.returnValue(Promise.resolve({ tst: 2 }));
    });

    afterAll(done => {
      browser.exit().then(done).catch(done.fail);
    });

    it('deve atualizar as notas do aluno', async done => {
      try {
        spyOn(Usuario, 'findOne').and.callThrough();
        await NotasTask.updateRemote(browser, 'test');

        expect(Usuario.findOne).toHaveBeenCalledWith({ where: { matricula: 'test' } });
        expect(qdiarios.getDisciplinas).toHaveBeenCalledWith(browser);
        expect(NotasTask.updateAll).toHaveBeenCalledWith(jasmine.any(Usuario), { tst: 2 });
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('se o aluno não existir, não deve atualizar as notas', async done => {
      try {
        spyOn(Usuario, 'findOne').and.returnValue(Promise.resolve(null));
        await NotasTask.updateRemote(browser, 'test');

        expect(qdiarios.getDisciplinas).not.toHaveBeenCalled();
        expect(NotasTask.updateAll).not.toHaveBeenCalled();
        done();
      } catch (e) {
        done.fail(e);
      }
    });

  });

  describe('scheduleUpdate()', () => {

    beforeEach(() => {
      spyOn(queue, 'create').and.callThrough();
      spyOn(cipher, 'decrypt').and.returnValue('decrypted');
    });

    it('deve buscar todos os alunos', async done => {
      try {
        spyOn(Usuario, 'all').and.returnValue(Promise.resolve([]));
        await NotasTask.scheduleUpdate();

        expect(Usuario.all).toHaveBeenCalled();
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('deve criar um job para cada aluno', async done => {
      try {
        spyOn(Usuario, 'all').and.returnValue(Promise.resolve([
          { id: 'a', matricula: 't1', password: 'p1', endpoint: 'e1' },
          { id: 'b', matricula: 't2', password: 'p2', endpoint: 'e2' },
          { id: 'c', matricula: 't3', password: 'p3', endpoint: 'e3' }
        ]));
        await NotasTask.scheduleUpdate();

        expect(queue.create).toHaveBeenCalledWith('readnotas', {
          userid: 'a',
          matricula: 't1',
          senha: 'decrypted',
          endpoint: 'e1'
        });
        expect(queue.create).toHaveBeenCalledWith('readnotas', {
          userid: 'b',
          matricula: 't2',
          senha: 'decrypted',
          endpoint: 'e2'
        });
        expect(queue.create).toHaveBeenCalledWith('readnotas', {
          userid: 'c',
          matricula: 't3',
          senha: 'decrypted',
          endpoint: 'e3'
        });
        done();
      } catch (e) {
        done.fail(e);
      }
    });

  });

});