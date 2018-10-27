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

  it('deve retornar os endpoints', asyncTest(async () => {
    const query = `query {
      endpoints {
        nome
        url
      }
    }`;
    const res = await graphql(schema, query);
    expect(res.data!.endpoints).toEqual([
      {
        nome: 'localhost',
        url: 'http://localhost:9595'
      }
    ]);
  }));


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
        .map(({ notas, boletim, ...disciplina }) => disciplina);

      expect(periodos[0].disciplinas).toEqual(disciplinas);
    }));

    it('deve retornar notas corretas', asyncTest(async () => {
      const query = `query {
        session(id: "${session}") {
          periodos {
            disciplinas {
              boletim {
                situacao
                etapa1
                etapa2
                rp_etapa1
                rp_etapa2
              }
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
        .map(({ notas, boletim, ...disciplina }) => ({ notas, boletim }));

      expect(periodos[0].disciplinas).toEqual(disciplinas);
    }));


    let disciplina_id: string;

    it('deve buscar disciplina por nome', asyncTest(async () => {
      const query = `query {
        session(id: "${session}") {
          periodos {
            disciplinas(nome: "programacao") {
              id
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
          id: jasmine.any(String),
          nome: 'Lógica de Programação',
          turma: '00001.TS.TII_I.4M',
          professor: {
            nome: 'ROGER CAMPBELL'
          }
        }
      ]);
      disciplina_id = periodos[0].disciplinas[0].id;
    }));

    it('deve buscar disciplina por id', asyncTest(async () => {
      const query = `query {
        session(id: "${session}") {
          periodo(nome: "2015/1") {
            correto: disciplina(id: "${disciplina_id}") {
              nome
              turma
              professor {
                nome
              }
            }
            incorreto: disciplina(id: "1234") {
              nome
            }
          }
        }
      }`;
      const { data, errors } = await graphql(schema, query);
      expect(data!.session).toBeTruthy();

      const { session: { periodo } } = data!;
      expect(periodo.incorreto).toBeFalsy();
      expect(periodo.correto).toEqual({
        nome: 'Lógica de Programação',
        turma: '00001.TS.TII_I.4M',
        professor: {
          nome: 'ROGER CAMPBELL'
        }
      });
    }));

    let nota: any;

    it('deve buscar disciplina pela nota', asyncTest(async () => {
      const query = `query {
        session(id: "${session}") {
          periodo(nome: "2015/1") {
            disciplina(id: "${disciplina_id}") {
              notas {
                id
                descricao
                disciplina {
                  nome
                  turma
                  professor {
                    nome
                  }
                }
              }
            }
          }
        }
      }`;
      const { data, errors } = await graphql(schema, query);
      expect(data!.session).toBeTruthy();
      expect(data!.session!.periodo).toBeTruthy();

      const { session: { periodo } } = data!;
      expect(periodo.disciplina.notas.length > 0).toBeTruthy();
      nota = periodo.disciplina.notas[0];
      expect(nota.disciplina).toEqual({
        nome: 'Lógica de Programação',
        turma: '00001.TS.TII_I.4M',
        professor: {
          nome: 'ROGER CAMPBELL'
        }
      });
    }));

    it('deve buscar nota pelo id', asyncTest(async () => {
      const query = `query {
        session(id: "${session}") {
          correto: nota(id: "${nota.id}") {
            id
            descricao
            disciplina {
              nome
              turma
              professor {
                nome
              }
            }
          }
          incorreto1: nota(id: "123") {
            id
          }
          incorreto2: nota(id: "${'0'.repeat(36)}") {
            id
          }
        }
      }`;
      const { data, errors } = await graphql(schema, query);
      expect(data!.session).toBeTruthy();

      expect(data!.session.incorreto1).toBeFalsy();
      expect(data!.session.incorreto2).toBeFalsy();
      expect(data!.session.correto).toEqual(nota);
    }));

    it('deve buscar periodo por nome', asyncTest(async () => {
      const query = `query {
        session(id: "${session}") {
          correto: periodo(nome: "2015/1") {
            nome
          }
          incorreto1: periodo(nome: "0000_0000000000") {
            nome
          }
          incorreto2: periodo(nome: "1999/3") {
            nome
          }
        }
      }`;
      const { data, errors } = await graphql(schema, query);
      expect(data!.session).toBeTruthy();
      expect(data!.session!.correto).toBeTruthy();
      expect(data!.session!.incorreto1).toBeFalsy();
      expect(data!.session!.incorreto2).toBeFalsy();

      const { session: { correto } } = data!;
      expect(correto).toEqual({
        nome: '2015/1'
      });
    }));

    describe('favoritos', () => {

      it('deve definir disciplina como favorita', asyncTest(async () => {
        const query = `mutation {
          session(id: "${session}") {
            correto: setFavorite(periodo: "2015/1", disciplina: "${disciplina_id}", state: true)
            incorreto: setFavorite(periodo: "000000001a", disciplina: "${disciplina_id}", state: true)
          }
        }`;
        const { data } = await graphql(schema, query);
        expect(data).toEqual({
          session: {
            correto: true,
            incorreto: false
          }
        });
      }));

      it('deve mostrar disciplina favorita', asyncTest(async () => {
        const query = `query {
          session(id: "${session}") {
            periodo(nome: "2015/1") {
              favoritos {
                id
                nome
                turma
                favorito
                professor {
                  nome
                }
              }
            }
          }
        }`;
        const { data } = await graphql(schema, query);
        expect(data).toEqual({
          session: {
            periodo: {
              favoritos: [
                {
                  id: disciplina_id,
                  nome: 'Lógica de Programação',
                  turma: '00001.TS.TII_I.4M',
                  favorito: true,
                  professor: {
                    nome: 'ROGER CAMPBELL'
                  }
                }
              ]
            }
          }
        });
      }));

    });

    it('deve deslogar', asyncTest(async () => {
      const query = `mutation {
        session(id: "${session}") {
          logout
        }
      }`;
      const { data } = await graphql(schema, query);
      expect(data).toEqual({
        session: {
          logout: true
        }
      });

      const query2 = `query {
        session(id: "${session}") {
          id
        }
      }`;
      const { data: data2 } = await graphql(schema, query);
      expect(data2!.session).toBeFalsy();
    }));

  });

});
