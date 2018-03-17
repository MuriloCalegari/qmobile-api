import { UsuarioDto } from './../database/usuario';
import { StrategyType } from './../services/strategy/factory';
import * as auth from '../services/auth/authenticate';
import * as cipher from '../services/cipher/cipher';
import { NotasTask } from './notas';
import { TaskQueue } from './queue';
import { QAcademicoStrategy } from '../services/strategy/qacademico';
import { StrategyFactory } from '../services/strategy/factory';
import { DatabaseService } from '../database/database';
import { asyncTest } from '../test-utils';
import { DisciplinaService } from '../database/disciplina';
import { ProfessorService } from '../database/professor';
import { DisciplinaProfessorService } from '../database/disciplina_professor';

import * as moment from 'moment';
import { UsuarioDisciplinaService } from '../database/usuario_disciplina';

fdescribe('NotasTask', () => {

  let usuario: UsuarioDto;

  let limpar = () => DatabaseService.truncate(
    ['nota', 'disciplina', 'professor', 'disciplina_professor', 'usuario_disciplina']
  );

  beforeAll(asyncTest(async () => {
    spyOn(NotasTask, 'updateRemote').and.returnValue(
      Promise.resolve()
    );
    await limpar();
    usuario = await auth.login('http://localhost:9595', 'test', 'pass');
    (NotasTask.updateRemote as jasmine.Spy).and.callThrough();
  }));

  afterAll(() => {
    usuario =
      limpar = null as any;
  });

  describe('updateDisciplina()', () => {

    beforeEach(() => {
      spyOn(NotasTask, 'updateEtapa').and.returnValue(
        Promise.resolve([[{ nota: 1 }, 'nova']])
      );
    });

    it('deve criar relações', asyncTest(async () => {
      const now = new Date();
      await NotasTask.updateDisciplina(
        usuario.id!,
        usuario.endpoint,
        {
          etapas: [],
          turma: '20174M',
          nome: 'Programação 2',
          professor: 'Jubileu',
          periodo: now
        }
      );

      const disciplina = (await DisciplinaService.findByNome(usuario.endpoint, 'Programação 2'))!;
      expect(disciplina).toBeTruthy();
      expect(disciplina.nome).toBe('Programação 2');

      const professor = (await ProfessorService.findByNome(usuario.endpoint, 'Jubileu'))!;
      expect(professor).toBeTruthy();
      expect(professor.nome).toBe('Jubileu');
      expect(professor.endpoint.toString()).toBe(usuario.endpoint.toString());

      const dp = (await DisciplinaProfessorService.find({
        professor: professor.id!,
        disciplina: disciplina.id!,
        turma: '20174M',
        periodo: new Date()
      }))!;
      expect(dp).toBeTruthy();
      expect(moment(dp.periodo).isSame(now, 'day')).toBeTruthy();

      const ud = (await UsuarioDisciplinaService.find({
        disciplina_professor: dp.id!,
        usuario: usuario.id!
      }));

      expect(ud).toBeTruthy();
    }));


    it('deve manter apenas uma relação', asyncTest(async () => {
      await limpar();

      const disc = {
        etapas: [],
        turma: '20174M',
        nome: 'Programação 2',
        professor: 'Jubileu',
        periodo: new Date()
      };

      await NotasTask.updateDisciplina(usuario.id!, usuario.endpoint, disc);
      await NotasTask.updateDisciplina(usuario.id!, usuario.endpoint, disc);
      const db = await DatabaseService.getDatabase();

      const disciplinas = await db.query('SELECT * FROM disciplina');
      expect(disciplinas.length).toBe(1);

      const professores = await db.query('SELECT * FROM professor');
      expect(professores.length).toBe(1);

      const dps = await db.query('SELECT * FROM disciplina_professor');
      expect(dps.length).toBe(1);

      const uds = await db.query('SELECT * FROM usuario_disciplina');
      expect(uds.length).toBe(1);
    }));

    it('deve criar duas disciplinas', asyncTest(async () => {
      await limpar();

      const disc = {
        etapas: [],
        turma: '20174M',
        nome: 'Programação 2',
        professor: 'Jubileu',
        periodo: new Date()
      };

      await NotasTask.updateDisciplina(usuario.id!, usuario.endpoint, disc);
      await NotasTask.updateDisciplina(usuario.id!, usuario.endpoint, { ...disc, nome: 'Programação 3' });
      const db = await DatabaseService.getDatabase();

      const disciplinas = await db.query('SELECT * FROM disciplina');
      expect(disciplinas.length).toBe(2);

      const professores = await db.query('SELECT * FROM professor');
      expect(professores.length).toBe(1);

      const dps = await db.query('SELECT * FROM disciplina_professor');
      expect(dps.length).toBe(2);

      const uds = await db.query('SELECT * FROM usuario_disciplina');
      expect(uds.length).toBe(2);
    }));

    it('deve atualizar as etapas', asyncTest(async () => {
      const disc = {
        turma: '20174M',
        nome: 'Programação 4',
        professor: 'Jubileu',
        periodo: new Date()
      };

      await NotasTask.updateDisciplina(
        usuario.id!,
        usuario.endpoint,
        {
          ...disc,
          etapas: [{ numero: 1, notas: [] }, { numero: 2, notas: [] }] as any
        }
      );

      expect(NotasTask.updateEtapa).toHaveBeenCalledWith(
        jasmine.any(Number),
        { numero: 1, notas: [] }
      );
      expect(NotasTask.updateEtapa).toHaveBeenCalledWith(
        jasmine.any(Number),
        { numero: 2, notas: [] }
      );
    }));

  });

  /*describe('updateEtapa()', () => {

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
          { turma: 1 },
          { turma: 2 },
          { turma: 3 },
        ] as any);
        expect(NotasTask.updateDisciplina).toHaveBeenCalledTimes(3);
        expect(NotasTask.updateDisciplina).toHaveBeenCalledWith(usuario, { turma: 1 });
        expect(NotasTask.updateDisciplina).toHaveBeenCalledWith(usuario, { turma: 2 });
        expect(NotasTask.updateDisciplina).toHaveBeenCalledWith(usuario, { turma: 3 });
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

    let strategy: QAcademicoStrategy;
    beforeAll(async done => {
      try {
        strategy = await StrategyFactory.build(StrategyType.QACADEMICO, 'http://localhost:9595') as any;
        await strategy.login('test', 'pass');
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    beforeEach(() => {
      spyOn(NotasTask, 'updateAll').and.returnValue(Promise.resolve({ tst: 1 }));
      spyOn(strategy, 'getPeriodos').and.callThrough();
      spyOn(strategy, 'getPeriodo').and.callThrough();
    });

    afterAll(done => {
      strategy.release().then(done).catch(done.fail);
    });

    it('updatePast=false deve atualizar apenas o período mais recente', async done => {
      try {
        (strategy.getPeriodos as jasmine.Spy).and.returnValue(Promise.resolve(
          [
            { codigo: '2018_1', nome: '2018/1' },
            { codigo: '2017_1', nome: '2017/1' }
          ]
        ));
        await NotasTask.updateRemote(strategy, 'test');
        expect(strategy.getPeriodo).toHaveBeenCalledTimes(1);
        expect(strategy.getPeriodo).toHaveBeenCalledWith({ codigo: '2017_2', nome: '2017/2' });
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('updatePast=true deve atualizar todos os períodos', async done => {
      try {
        (strategy.getPeriodos as jasmine.Spy).and.returnValue(Promise.resolve(
          [
            { codigo: '2018_1', nome: '2017/2' },
            { codigo: '2017_1', nome: '2017/1' }
          ]
        ));
        await NotasTask.updateRemote(strategy, 'test');
        expect(strategy.getPeriodo).toHaveBeenCalledTimes(2);
        expect(strategy.getPeriodo).toHaveBeenCalledWith({ codigo: '2018_1', nome: '2018/1' });
        expect(strategy.getPeriodo).toHaveBeenCalledWith({ codigo: '2017_1', nome: '2017/1' });
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('deve atualizar as notas do aluno', async done => {
      try {
        spyOn(Usuario, 'findOne').and.callThrough();
        await NotasTask.updateRemote(strategy, 'test');

        expect(Usuario.findOne).toHaveBeenCalledWith({ where: { matricula: 'test' } });
        expect(strategy.getPeriodos).toHaveBeenCalled();
        expect(strategy.getPeriodo).toHaveBeenCalled();
        expect(NotasTask.updateAll).toHaveBeenCalledWith(jasmine.any(Usuario), jasmine.any(Array));
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('se o aluno não existir, não deve atualizar as notas', async done => {
      try {
        spyOn(Usuario, 'findOne').and.returnValue(Promise.resolve(null));
        await NotasTask.updateRemote(strategy, 'test');

        expect(strategy.getPeriodos).not.toHaveBeenCalled();
        expect(strategy.getPeriodo).not.toHaveBeenCalled();
        expect(NotasTask.updateAll).not.toHaveBeenCalled();
        done();
      } catch (e) {
        done.fail(e);
      }
    });

  });

  describe('scheduleUpdate()', () => {

    beforeEach(() => {
      spyOn(TaskQueue.getQueue(), 'create').and.callThrough();
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
        const queue = TaskQueue.getQueue();
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

  });*/

});
