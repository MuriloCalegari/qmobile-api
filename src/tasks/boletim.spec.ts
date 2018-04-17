import { UUID } from './../database/uuid';
import { RemoteBoletim } from './../services/strategy/factory';
import { DisciplinaDto, DisciplinaService, DisciplinaExtras } from './../database/disciplina';
import { UsuarioDto } from './../database/usuario';
import { asyncTest } from '../test-utils';
import * as auth from '../services/auth/authenticate';
import * as moment from 'moment';
import { DatabaseService } from '../database/database';
import { NotasTask } from './notas';
import { BoletimTask } from './boletim';
import { BoletimService } from '../database/boletim';

describe('BoletimTask', () => {

  let usuario: UsuarioDto;
  let disciplina: DisciplinaDto & DisciplinaExtras;
  let periodo = moment('01/2018', 'MM/YYYY').toDate();

  beforeAll(asyncTest(async () => {
    await DatabaseService.truncate(
      ['nota', 'disciplina', 'professor', 'disciplina_professor', 'usuario_disciplina', 'boletim']
    );
    usuario = await auth.login('http://localhost:9595', 'test', 'pass');
    await NotasTask.updateDisciplina(usuario.id!, usuario.endpoint, {
      turma: '2015gr',
      nome: 'Disciplina teste',
      professor: 'Teste',
      periodo,
      etapas: []
    });
    disciplina = await DisciplinaService.getDisciplinaByNome(usuario, periodo, 'Disciplina teste');
  }));

  afterAll(() => {
    usuario =
      disciplina =
      periodo = null as any;
  });

  it('Deve ter criado dados de teste', () => {
    expect(disciplina).toBeTruthy();
    expect(usuario).toBeTruthy();
  });

  describe('updateBoletim()', () => {

    it('deve fazer insert do boletim da disciplina', asyncTest(async () => {
      const boletim: RemoteBoletim = {
        disciplina: disciplina.nome,
        data: periodo,
        situacao: 'Aprovado',
        etapa1: 6,
        etapa2: 8
      };

      await BoletimTask.updateBoletim(usuario, boletim);

      const boletimDb = await BoletimService.findByUD(disciplina.ud);
      expect(boletimDb).toBeTruthy();
      expect(boletimDb.etapa1).toBe(6);
      expect(boletimDb.etapa2).toBe(8);
      expect(boletimDb.situacao).toBe('Aprovado');
    }));

    it('deve fazer update do boletim da disciplina', asyncTest(async () => {
      const boletim: RemoteBoletim = {
        disciplina: disciplina.nome,
        data: periodo,
        situacao: 'Reprovado',
        etapa1: 3,
        etapa2: 5
      };

      await BoletimTask.updateBoletim(usuario, boletim);

      const boletimDb = await BoletimService.findByUD(disciplina.ud);
      expect(boletimDb).toBeTruthy();
      expect(boletimDb.etapa1).toBe(3);
      expect(boletimDb.etapa2).toBe(5);
      expect(boletimDb.situacao).toBe('Reprovado');

      const db = await DatabaseService.getDatabase();
      const [{ count }] = await db.query('SELECT COUNT(*) AS count FROM boletim');
      expect(count).toBe(1);
    }));

    it('deve fazer update do boletim da disciplina', asyncTest(async () => {
      const boletim: RemoteBoletim = {
        disciplina: disciplina.nome,
        data: periodo,
        situacao: 'Reprovado',
        etapa1: 3,
        etapa2: 5
      };

      await BoletimTask.updateBoletim(usuario, boletim);

      const boletimDb = await BoletimService.findByUD(disciplina.ud);
      expect(boletimDb).toBeTruthy();
      expect(boletimDb.etapa1).toBe(3);
      expect(boletimDb.etapa2).toBe(5);
      expect(boletimDb.situacao).toBe('Reprovado');

      const db = await DatabaseService.getDatabase();
      const [{ count }] = await db.query('SELECT COUNT(*) AS count FROM boletim');
      expect(count).toBe(1);
    }));

    it('deve ignorar disciplinas incorretas', asyncTest(async () => {
      const boletim: RemoteBoletim = {
        disciplina: 'abc',
        data: periodo,
        situacao: 'Reprovado',
        etapa1: 3,
        etapa2: 5
      };

      await BoletimTask.updateBoletim(usuario, boletim);

      const boletimDb = await BoletimService.findByUD(disciplina.ud);
      expect(boletimDb).toBeTruthy();
      expect(boletimDb.etapa1).toBe(3);
      expect(boletimDb.etapa2).toBe(5);
      expect(boletimDb.situacao).toBe('Reprovado');

      const db = await DatabaseService.getDatabase();
      const [{ count }] = await db.query('SELECT COUNT(*) AS count FROM boletim');
      expect(count).toBe(1);
    }));

  });

  describe('updateAll()', () => {

    beforeEach(() => {
      spyOn(BoletimTask, 'updateBoletim').and.returnValue(Promise.resolve());
    });

    it('deve passar todos os boletins para o updateBoletim()', asyncTest(async () => {
      await BoletimTask.updateAll(usuario, [{ bol: 1 }, { bol: 2 }] as any);
      expect(BoletimTask.updateBoletim).toHaveBeenCalledWith(usuario, { bol: 1 });
      expect(BoletimTask.updateBoletim).toHaveBeenCalledWith(usuario, { bol: 2 });
    }));

  });

  describe('updateRemote()', () => {

    let strategy;

    beforeEach(() => {
      spyOn(BoletimTask, 'updateAll').and.returnValue(Promise.resolve());
      strategy = jasmine.createSpyObj('strategy', ['getPeriodos', 'getBoletim']);
      strategy.getPeriodos.and.returnValue(Promise.resolve([
        { per: 1 },
        { per: 2 }
      ]));
      strategy.getBoletim.and.returnValue(Promise.resolve([
        { bol: 1 },
        { bol: 2 }
      ]));
    });

    afterEach(() => {
      strategy = null;
    });

    it('deve buscar os periodos no strategy', asyncTest(async () => {
      await BoletimTask.updateRemote(strategy, usuario.matricula);
      expect(strategy.getPeriodos).toHaveBeenCalled();
    }));

    it('updatePast=true deve buscar o boletim de todos os periodos', asyncTest(async () => {
      await BoletimTask.updateRemote(strategy, usuario.matricula, true);
      expect(strategy.getBoletim).toHaveBeenCalledWith({ per: 1 });
      expect(strategy.getBoletim).toHaveBeenCalledWith({ per: 2 });
    }));

    it('updatePast=false deve buscar o boletim do periodo mais recente apenas', asyncTest(async () => {
      await BoletimTask.updateRemote(strategy, usuario.matricula, false);
      expect(strategy.getBoletim).toHaveBeenCalledTimes(1);
      expect(strategy.getBoletim).toHaveBeenCalledWith({ per: 1 });
    }));

    it('deve chamar updateAll() para todos os boletins', asyncTest(async () => {
      await BoletimTask.updateRemote(strategy, usuario.matricula, true);
      expect(BoletimTask.updateAll).toHaveBeenCalledWith({
        ...usuario,
        id: jasmine.any(UUID),
        endpoint: jasmine.any(UUID),
      }, [{ bol: 1 }, { bol: 2 }]);
      expect(BoletimTask.updateAll).toHaveBeenCalledWith({
        ...usuario,
        id: jasmine.any(UUID),
        endpoint: jasmine.any(UUID),
      }, [{ bol: 1 }, { bol: 2 }]);
    }));

  });

});
