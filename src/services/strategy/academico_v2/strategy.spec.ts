import { QAcademicoV2Strategy } from './index';
import { QAcademicoStrategy } from './../qacademico/index';
import { asyncTest } from '../../../test-utils';
import { NumeroEtapa } from '../factory';

describe('QAcademicoV2', () => {

  let strategy: QAcademicoV2Strategy;

  beforeEach(() => {
    spyOn(QAcademicoStrategy.prototype, 'getPeriodo').and.returnValue([]);
    strategy = new QAcademicoV2Strategy('aaaa');
  });

  it('deve mapear notas N1', asyncTest(async () => {
    (QAcademicoStrategy.prototype.getPeriodo as jasmine.Spy).and.returnValue(Promise.resolve({
      disciplinas: [
        {
          etapas: [
            {
              notas: [
                { descricao: 'Exercício: N1 - Listas de exercício' }
              ]
            }
          ]
        }
      ]
    }));
    const ret = await strategy.getPeriodo(null as any);
    expect(ret as any).toEqual({
      disciplinas: [
        {
          etapas: [
            {
              numero: NumeroEtapa.ETAPA1,
              notas: [
                { descricao: 'Exercício: N1 - Listas de exercício' }
              ]
            }
          ]
        }
      ]
    });
  }));

  it('deve mapear notas N2', asyncTest(async () => {
    (QAcademicoStrategy.prototype.getPeriodo as jasmine.Spy).and.returnValue(Promise.resolve({
      disciplinas: [
        {
          etapas: [
            {
              notas: [
                { descricao: 'Exercício: N2 - Listas de exercício' }
              ]
            }
          ]
        }
      ]
    }));
    const ret = await strategy.getPeriodo(null as any);
    expect(ret as any).toEqual({
      disciplinas: [
        {
          etapas: [
            {
              numero: NumeroEtapa.ETAPA2,
              notas: [
                { descricao: 'Exercício: N2 - Listas de exercício' }
              ]
            }
          ]
        }
      ]
    });
  }));

  it('deve mapear notas N1 substitutivas', asyncTest(async () => {
    (QAcademicoStrategy.prototype.getPeriodo as jasmine.Spy).and.returnValue(Promise.resolve({
      disciplinas: [
        {
          etapas: [
            {
              notas: [
                { descricao: 'Prova: Prova substitutiva N1' }
              ]
            }
          ]
        }
      ]
    }));
    const ret = await strategy.getPeriodo(null as any);
    expect(ret as any).toEqual({
      disciplinas: [
        {
          etapas: [
            {
              numero: NumeroEtapa.RP_ETAPA1,
              notas: [
                { descricao: 'Prova: Prova substitutiva N1' }
              ]
            }
          ]
        }
      ]
    });
  }));

  it('deve mapear notas N2 substitutivas', asyncTest(async () => {
    (QAcademicoStrategy.prototype.getPeriodo as jasmine.Spy).and.returnValue(Promise.resolve({
      disciplinas: [
        {
          etapas: [
            {
              notas: [
                { descricao: 'Prova: Prova substitutiva N2' }
              ]
            }
          ]
        }
      ]
    }));
    const ret = await strategy.getPeriodo(null as any);
    expect(ret as any).toEqual({
      disciplinas: [
        {
          etapas: [
            {
              numero: NumeroEtapa.RP_ETAPA2,
              notas: [
                { descricao: 'Prova: Prova substitutiva N2' }
              ]
            }
          ]
        }
      ]
    });
  }));

});
