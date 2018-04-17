import { QAcademicoStrategy } from './index';
import { asyncTest } from '../../../test-utils';
import { StrategyFactory, StrategyType } from '../factory';
import { QBoletim } from './qboletim';

describe('QBoletim', () => {

  let strategy: QAcademicoStrategy;

  beforeAll(asyncTest(async () => {
    strategy = await StrategyFactory.build(StrategyType.QACADEMICO, 'http://localhost:9595') as any;
    await strategy.login('test', '12345');
    spyOn(strategy, 'getUrl').and.callThrough();
  }));

  it('deve buscar pagina de boletim conforme periodo', asyncTest(async () => {
    await QBoletim.getBoletim(strategy, {
      nome: '',
      codigo: '2017_1'
    });
    expect(strategy.getUrl).toHaveBeenCalledWith('http://localhost:9595/index.asp?t=2032&cmbanos=2017&cmbperiodos=1');
  }));

  it('deve ler todos os dados da tabela', asyncTest(async () => {
    const ret = await QBoletim.getBoletim(strategy, {
      nome: '',
      codigo: '2017_1'
    });
    expect(ret.length).toBe(12);
    ret.forEach(disciplina => {
      const keys = [
        'Componente Curricular', 'CH', 'Turma', 'T. Faltas', 'M Final',
        '1E', 'F', '1R1E', 'F', 'NF1E', '2E',
        'F', '1R2E', 'F', 'Situação'
      ];
      const objKeys = Object.keys(disciplina);
      keys.forEach(key => {
        expect(objKeys).toContain(key);
        expect(disciplina[key]).toBeDefined();
      });
    });
  }));

});
