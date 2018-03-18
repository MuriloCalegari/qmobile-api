import { schema } from './schema/index';
import { asyncTest, clearDatabase } from '../test-utils';
import { graphql } from 'graphql';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('E2E', () => {

  let session: string;
  let payload: any;

  let createSession = async () => {
    const query = `mutation {
      login(input: {
        endpoint: "http://localhost:9595",
        matricula: "test",
        password: "pass"
      }) {
        novo
        session
      }
    }`;
    const { data } = await graphql(schema, query);
    return data!.login.session;
  };

  beforeAll(asyncTest(async () => {
    await Promise.all([
      clearDatabase(),
      (async () => {
        payload = await fs.readFile(path.join(__dirname, 'e2e.payload.json'), 'utf-8');
        payload = JSON.parse(payload);
        payload.periodos.forEach(periodo => {
          periodo.disciplinas.forEach(disciplina => {
            disciplina.id =
              disciplina.professor.id = jasmine.any(String);
            disciplina.notas.forEach(nota => {
              nota.id = jasmine.any(String);
              // nota.nota =
              //   nota.peso =
              //   nota.notamaxima =
                nota.media = jasmine.any(Number);
            });
          });
        });
      })()
    ]);
  }));

  afterAll(() => {
    createSession =
      session =
      payload = null as any;
  });

  it('não deve permitir query com sessão inválida', asyncTest(async () => {
    const query = `query {
      session(id: "06e034af-ba1c-4045-a461-dc62bd458ade") {
        nome
      }
    }`;
    const res = await graphql(schema, query);
    expect(res.data!.session).toBeFalsy();
  }));

  it('deve negar endpoints não homologados', asyncTest(async () => {
    const query = `mutation {
      login(input: {
        endpoint: "http://localhost:8081",
        matricula: "test",
        password: "pass"
      }) {
        novo
        session
      }
    }`;
    const { errors } = await graphql(schema, query);
    expect(errors!.length).toBe(1);

    const [erro] = errors!;
    expect(erro.message).toBe('Endpoint não homologado');
  }));

  it('deve logar com sucesso', asyncTest(async () => {
    const query = `mutation {
      login(input: {
        endpoint: "http://localhost:9595",
        matricula: "test",
        password: "pass"
      }) {
        novo
        session
      }
    }`;
    const { data } = await graphql(schema, query);
    expect(data!.login).toBeTruthy();

    const { login } = data!;
    expect(login.novo).toBeTruthy();
    expect(login.session).toBeTruthy();
    expect(login.session.length).toBe(36);
    session = login.session;
  }));

  describe('usuario logado', () => {

    beforeEach(asyncTest(async () => {
      if (!session) {
        session = await createSession();
      }
    }));

    it('deve retornar dados corretos sobre o usuário', asyncTest(async () => {
      const query = `query {
        session(id: "${session}") {
          id
          matricula
          nome
          endpoint {
            id
            nome
            url
          }
        }
      }`;
      const { data } = await graphql(schema, query);
      expect(data!.session).toBeTruthy();
      expect(data!.session).toEqual({
        id: jasmine.any(String),
        matricula: 'test',
        nome: 'Aluno Teste',
        endpoint: {
          id: jasmine.any(String),
          nome: 'localhost',
          url: 'http://localhost:9595'
        }
      });
    }));

    it('deve retornar periodos corretos', asyncTest(async () => {
      const query = `query {
        session(id: "${session}") {
          periodos {
            nome
          }
        }
      }`;
      const { data } = await graphql(schema, query);
      expect(data!.session).toBeTruthy();
      expect(data!.session!.periodos).toEqual([
        {
          nome: '2015/1'
        }
      ]);
    }));

    it('deve retornar disciplinas corretas', asyncTest(async () => {
      const query = `query {
        session(id: "${session}") {
          periodos {
            disciplinas {
              id
              nome
              turma
              professor {
                id
                nome
              }
            }
          }
        }
      }`;
      const { data, errors } = await graphql(schema, query);
      expect(data!.session).toBeTruthy();
      expect(data!.session!.periodos).toBeTruthy();

      const { session: { periodos } } = data!;
      const disciplinas = payload.periodos[0].disciplinas
        .map(({ notas, ...disciplina }) => disciplina);

      expect(periodos[0].disciplinas).toEqual(disciplinas);
    }));

    it('deve retornar notas corretas', asyncTest(async () => {
      const query = `query {
        session(id: "${session}") {
          periodos {
            disciplinas {
              notas {
                id
                descricao
                data
                etapa
                media
                peso
                nota
                notamaxima
              }
            }
          }
        }
      }`;
      const { data, errors } = await graphql(schema, query);
      expect(data!.session).toBeTruthy();
      expect(data!.session!.periodos).toBeTruthy();

      const { session: { periodos } } = data!;
      const disciplinas = payload.periodos[0].disciplinas
        .map(({ notas, ...disciplina }) => ({ notas }));

      expect(periodos[0].disciplinas).toEqual(disciplinas);
    }));

    it('deve buscar disciplina por nome', asyncTest(async () => {
      const query = `query {
        session(id: "${session}") {
          periodos {
            disciplinas(nome: "programacao") {
              nome
              turma
              professor {
                nome
              }
            }
          }
        }
      }`;
      const { data, errors } = await graphql(schema, query);
      expect(data!.session).toBeTruthy();
      expect(data!.session!.periodos).toBeTruthy();

      const { session: { periodos } } = data!;
      expect(periodos[0].disciplinas).toEqual([
        {
          nome: 'Lógica de Programação',
          turma: '00001.TS.TII_I.4M',
          professor: {
            nome: 'ROGER CAMPBELL'
          }
        }
      ]);
    }));

    it('deve calcular média da disciplina', asyncTest(async () => {
      const query = `query {
        session(id: "${session}") {
          periodos {
            disciplinas(nome: "matematica") {
              media
            }
          }
        }
      }`;
      const { data, errors } = await graphql(schema, query);
      expect(data!.session).toBeTruthy();
      expect(data!.session!.periodos).toBeTruthy();

      const { session: { periodos } } = data!;
      expect(periodos[0].disciplinas).toEqual([
        {
          media: 7.4
        }
      ]);
    }));

    it('deve buscar periodo por nome', asyncTest(async () => {
      const query = `query {
        session(id: "${session}") {
          periodo(nome: "2015/1") {
            nome
          }
        }
      }`;
      const { data, errors } = await graphql(schema, query);
      expect(data!.session).toBeTruthy();
      expect(data!.session!.periodo).toBeTruthy();

      const { session: { periodo } } = data!;
      expect(periodo).toEqual({
        nome: '2015/1'
      });
    }));

  });

});
