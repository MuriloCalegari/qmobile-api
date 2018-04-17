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
      nome: '2017/1',
      codigo: '2017_1'
    });
    expect(ret).toEqual([{
      disciplina: 'Língua Portuguesa e Literatura I',
      situacao: 'Aprovado',
      etapa1: 9,
      etapa2: 6,
      rp_etapa1: -1,
      rp_etapa2: -1,
      data: jasmine.any(Date) as any
    },
    {
      disciplina: 'Educação Física I',
      situacao: 'Aprovado',
      etapa1: 8,
      etapa2: 4,
      rp_etapa1: 0,
      rp_etapa2: 6,
      data: jasmine.any(Date) as any
    },
    {
      disciplina: 'Informática Básica',
      situacao: 'Aprovado',
      etapa1: 8.5,
      etapa2: 7,
      rp_etapa1: 0,
      rp_etapa2: -1,
      data: jasmine.any(Date) as any
    },
    {
      disciplina: 'Língua Estrangeira I',
      situacao: 'Aprovado',
      etapa1: 9.5,
      etapa2: 7.5,
      rp_etapa1: -1,
      rp_etapa2: -1,
      data: jasmine.any(Date) as any
    },
    {
      disciplina: 'Elaboração de Projetos/Metodologia de Pesquisa',
      situacao: 'Aprovado',
      etapa1: 8,
      etapa2: 9.5,
      rp_etapa1: -1,
      rp_etapa2: -1,
      data: jasmine.any(Date) as any
    },
    {
      disciplina: 'Sociologia I',
      situacao: 'Aprovado',
      etapa1: 7.5,
      etapa2: 6,
      rp_etapa1: -1,
      rp_etapa2: -1,
      data: jasmine.any(Date) as any
    },
    {
      disciplina: 'Filosofia I',
      situacao: 'Aprovado',
      etapa1: 3.5,
      etapa2: 6.5,
      rp_etapa1: 7.5,
      rp_etapa2: -1,
      data: jasmine.any(Date) as any
    },
    {
      disciplina: 'Matemática I',
      situacao: 'Aprovado',
      etapa1: 7.5,
      etapa2: 7,
      rp_etapa1: 0,
      rp_etapa2: 0,
      data: jasmine.any(Date) as any
    },
    {
      disciplina: 'Física I',
      situacao: 'Aprovado',
      etapa1: 6,
      etapa2: 7,
      rp_etapa1: 0,
      rp_etapa2: 0,
      data: jasmine.any(Date) as any
    },
    {
      disciplina: 'Química I',
      situacao: 'Aprovado',
      etapa1: 8.5,
      etapa2: 10,
      rp_etapa1: 0,
      rp_etapa2: 0,
      data: jasmine.any(Date) as any
    },
    {
      disciplina: 'Biologia I',
      situacao: 'Aprovado',
      etapa1: 7,
      etapa2: 5.5,
      rp_etapa1: -1,
      rp_etapa2: 6,
      data: jasmine.any(Date) as any
    },
    {
      disciplina: 'Lógica de Programação',
      situacao: 'Aprovado',
      etapa1: 10,
      etapa2: 9.5,
      rp_etapa1: 0,
      rp_etapa2: 0,
      data: jasmine.any(Date) as any
    }]
    );
  }));

});
