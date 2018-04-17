import { QAcademicoStrategy } from './index';
import { asyncTest } from '../../../test-utils';
import { StrategyFactory, StrategyType } from '../factory';

describe('QAcademicoStrategy', () => {

  let strategy: QAcademicoStrategy;

  beforeAll(asyncTest(async () => {
    strategy = await StrategyFactory.build(StrategyType.QACADEMICO, 'http://localhost:9595') as any;
    await strategy.login('test', '12345');
  }));

  afterAll(() => {
    strategy = null as any;
  });

  it('deve processar os dados do boletim corretamente', asyncTest(async () => {
    const ret = await strategy.getBoletim({
      nome: '',
      codigo: '2017_1'
    });
    expect(ret).toEqual([
      {
        disciplina: 'Redes de Computadores I',
        situacao: 'Aprovado',
        data: jasmine.any(Date) as any,
        etapa1: 7.4,
        etapa2: 7.8,
        rp_etapa1: -1,
        rp_etapa2: -1
      },
      {
        disciplina: 'Língua Portuguesa e Literatura III',
        situacao: 'Aprovado',
        data: jasmine.any(Date) as any,
        etapa1: 4.8,
        etapa2: 7.5,
        rp_etapa1: 8,
        rp_etapa2: -1
      },
      {
        disciplina: 'Educação Física III',
        situacao: 'Aprovado',
        data: jasmine.any(Date) as any,
        etapa1: 9,
        etapa2: 10,
        rp_etapa1: -1,
        rp_etapa2: -1
      },
      {
        disciplina: 'Sociologia III',
        situacao: 'Aprovado',
        data: jasmine.any(Date) as any,
        etapa1: 6.5,
        etapa2: 6.5,
        rp_etapa1: -1,
        rp_etapa2: -1
      },
      {
        disciplina: 'Filosofia III',
        situacao: 'Aprovado',
        data: jasmine.any(Date) as any,
        etapa1: 6.9,
        etapa2: 6.9,
        rp_etapa1: -1,
        rp_etapa2: -1
      },
      {
        disciplina: 'Matemática III',
        situacao: 'Aprovado',
        data: jasmine.any(Date) as any,
        etapa1: 6.2,
        etapa2: 6.1,
        rp_etapa1: -1,
        rp_etapa2: -1
      },
      {
        disciplina: 'Física III',
        situacao: 'Aprovado',
        data: jasmine.any(Date) as any,
        etapa1: 6.8,
        etapa2: 6.8,
        rp_etapa1: 0,
        rp_etapa2: 0
      },
      {
        disciplina: 'Língua Estrangeira III',
        situacao: 'Aprovado',
        data: jasmine.any(Date) as any,
        etapa1: 10,
        etapa2: 6.7,
        rp_etapa1: -1,
        rp_etapa2: -1
      },
      {
        disciplina: 'Sistemas Operacionais Modernos',
        situacao: 'Aprovado',
        data: jasmine.any(Date) as any,
        etapa1: 7.5,
        etapa2: 6.5,
        rp_etapa1: -1,
        rp_etapa2: -1
      },
      {
        disciplina: 'Gestão e Empreendedorismo',
        situacao: 'Aprovado',
        data: jasmine.any(Date) as any,
        etapa1: 6,
        etapa2: 6.8,
        rp_etapa1: -1,
        rp_etapa2: -1
      },
      {
        disciplina: 'Programação Visual',
        situacao: 'Aprovado',
        data: jasmine.any(Date) as any,
        etapa1: 10,
        etapa2: 10,
        rp_etapa1: -1,
        rp_etapa2: -1
      },
      {
        disciplina: 'Geografia II',
        situacao: 'Aprovado',
        data: jasmine.any(Date) as any,
        etapa1: 7,
        etapa2: 8.1,
        rp_etapa1: -1,
        rp_etapa2: -1
      },
      {
        disciplina: 'Programação de Internet II',
        situacao: 'Aprovado',
        data: jasmine.any(Date) as any,
        etapa1: 10,
        etapa2: 9.5,
        rp_etapa1: -1,
        rp_etapa2: -1
      }
    ]);
  }));

});
