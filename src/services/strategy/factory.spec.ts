import { StrategyFactory, StrategyType } from './factory';

describe('StrategyFactory', () => {

  describe('build()', () => {

    it('Deve retornar um strategy válido para um tipo válido', async done => {
      try {
        const strategy = await StrategyFactory.build(StrategyType.QACADEMICO, 'teste');
        expect(strategy).toBeTruthy();
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('Deve retornar null para um tipo inválido', async done => {
      try {
        const strategy = await StrategyFactory.build('abc' as any, 'teste');
        expect(strategy).toBeFalsy();
        done();
      } catch (e) {
        done.fail(e);
      }
    });

  });

});
