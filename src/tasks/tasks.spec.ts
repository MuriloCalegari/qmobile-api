import { Disciplina } from './../models/disciplina';
import { Nota } from './../models/nota';
import { Usuario } from './../models/usuario';
import * as auth from '../services/auth/authenticate';
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
    Promise.all([
      limpar(),
      (async () => {
        usuario = await auth.login('http://localhost:9595', 'test', 'pass');
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

});
