import { UUID } from './../database/uuid';
import { UsuarioDto, UsuarioService } from './../database/usuario';
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
import { NotaService } from '../database/nota';

describe('NotasTask', () => {

  let usuario: UsuarioDto;

  let limpar = () => DatabaseService.truncate(
    ['nota', 'disciplina', 'professor', 'disciplina_professor', 'usuario_disciplina']
  );

  beforeAll(asyncTest(async () => {
    spyOn(NotasTask, 'updateRemote').and.returnValue(
      Promise.resolve()
    );
    await limpar();
    [, usuario] = await auth.login('http://localhost:9595', 'test', 'pass');
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

  describe('updateEtapa()', () => {

    beforeEach(() => {
      spyOn(NotasTask, 'updateNota').and.returnValue(
        Promise.resolve([{ nota: 1 }, 'nova'])
      );
    });

    it('deve atualizar todas as notas da etapa', asyncTest(async () => {
      await NotasTask.updateEtapa(
        0,
        {
          numero: 1,
          notas: [{ nota: 1 }, { nota: 2 }] as any
        }
      );
      expect(NotasTask.updateNota).toHaveBeenCalledWith(0, 1, { nota: 1 });
      expect(NotasTask.updateNota).toHaveBeenCalledWith(0, 1, { nota: 2 });
    }));

  });

  describe('updateNota()', () => {

    let usuario_disciplina: number;

    beforeAll(asyncTest(async () => {
      await NotasTask.updateDisciplina(
        usuario.id!,
        usuario.endpoint,
        {
          etapas: [],
          turma: '20174M',
          nome: 'Programação 2',
          professor: 'Jubileu',
          periodo: new Date()
        }
      );
      const disciplina = (await DisciplinaService.findByNome(usuario.endpoint, 'Programação 2'))!;
      const professor = (await ProfessorService.findByNome(usuario.endpoint, 'Jubileu'))!;
      const dp = (await DisciplinaProfessorService.find({
        professor: professor.id!,
        disciplina: disciplina.id!,
        turma: '20174M',
        periodo: new Date()
      }))!;
      const ud = (await UsuarioDisciplinaService.find({
        disciplina_professor: dp.id!,
        usuario: usuario.id!
      }));
      usuario_disciplina = ud.id!;
    }));

    it('deve criar nota', asyncTest(async () => {
      const dados = {
        descricao: 'prova',
        peso: 10,
        notamaxima: 10,
        nota: 9
      };
      await NotasTask.updateNota(usuario_disciplina, 1, { ...dados, data: new Date() });
      const nota = (await NotaService.findByDescricao(usuario_disciplina, 'prova'))!;
      expect(nota).toBeTruthy();
      expect(nota).toEqual(jasmine.objectContaining(dados as any));
    }));

    it('não deve duplicar notas', asyncTest(async () => {
      const criar = () => NotasTask.updateNota(
        usuario_disciplina,
        1,
        {
          descricao: 'prova 2',
          peso: 10,
          notamaxima: 10,
          nota: 9,
          data: new Date()
        }
      );
      await criar();
      await criar();
      const db = await DatabaseService.getDatabase();

      const notas = await db.query('SELECT * FROM nota WHERE descricao=?', ['prova 2']);
      expect(notas.length).toBe(1);
    }));


    it('deve atualizar a nota', asyncTest(async () => {
      const criar = (nota: number) => NotasTask.updateNota(
        usuario_disciplina,
        1,
        {
          descricao: 'prova 4',
          peso: 10,
          notamaxima: 10,
          nota,
          data: new Date()
        }
      );
      const ret1 = await criar(6);
      const ret2 = await criar(9);
      const ret3 = await criar(9);
      const notadb = (await NotaService.findByDescricao(usuario_disciplina, 'prova 4'))!;

      expect(notadb.nota).toBe(9);
      expect(ret1).toEqual([jasmine.any(UUID), 'nova'] as any);
      expect(ret2).toEqual([jasmine.any(UUID), 'alterada'] as any);
      expect(ret3).toEqual([jasmine.any(UUID), 'normal'] as any);
    }));

  });

  describe('updateAll()', () => {

    it('deve filtrar os resultados retornados pelo updateDisciplina()', asyncTest(async () => {
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
      expect(NotasTask.updateDisciplina).toHaveBeenCalledWith(usuario.id, usuario.endpoint, { turma: 1 });
      expect(NotasTask.updateDisciplina).toHaveBeenCalledWith(usuario.id, usuario.endpoint, { turma: 2 });
      expect(NotasTask.updateDisciplina).toHaveBeenCalledWith(usuario.id, usuario.endpoint, { turma: 3 });
      expect(ret).toEqual({
        notas: {
          alteradas: [{ tst: 2 }, { tst: 6 }] as any,
          novas: [{ tst: 1 }, { tst: 5 }] as any,
        }
      });
    }));

  });

  describe('updateRemote()', () => {

    let strategy: QAcademicoStrategy;
    beforeAll(asyncTest(async () => {
      strategy = await StrategyFactory.build(StrategyType.QACADEMICO, 'http://localhost:9595') as any;
      await strategy.login('test', 'pass');
    }));

    beforeEach(() => {
      spyOn(NotasTask, 'updateAll').and.returnValue(Promise.resolve({ tst: 1 }));
      spyOn(strategy, 'getPeriodos').and.callThrough();
      spyOn(strategy, 'getPeriodo').and.callThrough();
    });

    afterAll(asyncTest(async () => {
      await strategy.release();
    }));

    it('updatePast=false deve atualizar apenas o período mais recente', asyncTest(async () => {
      await NotasTask.updateRemote(strategy, usuario.matricula, false);
      expect(strategy.getPeriodo).toHaveBeenCalledTimes(1);
      expect(strategy.getPeriodo).toHaveBeenCalledWith({ codigo: '2018_1', nome: '2018 / 1' });
    }));

    it('updatePast=true deve atualizar todos os períodos', asyncTest(async () => {
      await NotasTask.updateRemote(strategy, usuario.matricula, true);
      expect(strategy.getPeriodo).toHaveBeenCalledTimes(4);
      expect(strategy.getPeriodo).toHaveBeenCalledWith({ codigo: '2018_1', nome: '2018 / 1' });
      expect(strategy.getPeriodo).toHaveBeenCalledWith({ codigo: '2017_1', nome: '2017 / 1' });
      expect(strategy.getPeriodo).toHaveBeenCalledWith({ codigo: '2016_1', nome: '2016 / 1' });
      expect(strategy.getPeriodo).toHaveBeenCalledWith({ codigo: '2015_1', nome: '2015 / 1' });
    }));

    it('deve atualizar as notas do aluno', asyncTest(async () => {
      spyOn(UsuarioService, 'findByMatricula').and.callThrough();
      await NotasTask.updateRemote(strategy, usuario.matricula);

      expect(UsuarioService.findByMatricula).toHaveBeenCalledWith('test');
      expect(strategy.getPeriodos).toHaveBeenCalled();
      expect(strategy.getPeriodo).toHaveBeenCalled();
      expect(NotasTask.updateAll).toHaveBeenCalledWith(jasmine.anything(), jasmine.any(Array));
    }));

    it('se o aluno não existir, não deve atualizar as notas', asyncTest(async () => {
      spyOn(UsuarioService, 'findByMatricula').and.returnValue(Promise.resolve(null));
      await NotasTask.updateRemote(strategy, usuario.matricula);

      expect(strategy.getPeriodos).not.toHaveBeenCalled();
      expect(strategy.getPeriodo).not.toHaveBeenCalled();
      expect(NotasTask.updateAll).not.toHaveBeenCalled();
    }));

  });

  describe('scheduleUpdate()', () => {

    beforeEach(asyncTest(async () => {
      const queue = await TaskQueue.getQueue();
      spyOn(queue, 'create').and.callThrough();
      spyOn(cipher, 'decrypt').and.returnValue('decrypted');
    }));

    it('deve buscar todos os alunos', asyncTest(async () => {
      spyOn(UsuarioService, 'findAll').and.returnValue(Promise.resolve([]));
      await NotasTask.scheduleUpdate();

      expect(UsuarioService.findAll).toHaveBeenCalled();
    }));

    it('deve criar um job para cada aluno', asyncTest(async () => {
      const queue = await TaskQueue.getQueue();
      spyOn(UsuarioService, 'findAll').and.returnValue(Promise.resolve([
        { id: 'a' },
        { id: 'b' },
        { id: 'c' }
      ]));
      await NotasTask.scheduleUpdate();

      expect(queue.create).toHaveBeenCalledWith('readnotas', {
        userid: 'a'
      });
      expect(queue.create).toHaveBeenCalledWith('readnotas', {
        userid: 'b'
      });
      expect(queue.create).toHaveBeenCalledWith('readnotas', {
        userid: 'c'
      });
    }));

  });

});
