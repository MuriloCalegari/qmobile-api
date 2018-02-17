import * as webdriver from './webdriver';
import { QBrowser } from './qbrowser';

describe('QBrowser', () => {

  describe('create()', () => {

    it('Deve retornar uma instancia válida', async done => {
      try {
        const browser = await webdriver.create();
        expect(browser).toBeTruthy();
        expect(browser).toEqual(jasmine.any(QBrowser));

        const page = browser.getPage();
        expect(await page.url()).toBeTruthy();

        await browser.exit();
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('Deve retornar instancias diferentes', async done => {
      try {
        const browser1 = await webdriver.create();
        const browser2 = await webdriver.create();

        expect(browser1).toBeTruthy();
        expect(browser2).toBeTruthy();
        expect(browser1).not.toBe(browser2);

        await Promise.all([
          browser1.exit(),
          browser2.exit()
        ]);
        done();
      } catch (e) {
        done.fail(e);
      }
    });

  });

  describe('isValid()', () => {

    it('Deve retornar true se a instancia for válida', async done => {
      try {
        const browser = await webdriver.create();
        browser.setEndpoint('http://localhost:9595');

        expect(await browser.isValid()).toBeTruthy();

        await browser.exit();
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    describe('Deve retornar false se a instancia for inválida', () => {

      it('por falta de endpoint', async done => {
        try {
          const browser = await webdriver.create();
          browser.setEndpoint('');

          expect(await browser.isValid()).toBeFalsy();

          await browser.exit();
          done();
        } catch (e) {
          done.fail(e);
        }
      });

      it('por erro no webdriver', async done => {
        try {
          const browser = await webdriver.create();
          browser.setEndpoint('http://localhost:9595');
          spyOn(browser.getPage(), 'title').and.callFake(() => Promise.reject({}));

          expect(await browser.isValid()).toBeFalsy();

          (browser.getPage().title as jasmine.Spy).and.callThrough();
          await browser.exit();
          done();
        } catch (e) {
          done.fail(e);
        }
      });

      it('por estar desligada', async done => {
        try {
          const browser = await webdriver.create();
          await browser.destroy();
          await browser.exit(true);
          browser.setEndpoint('http://localhost:9595');

          expect(await browser.isValid()).toBeFalsy();

          done();
        } catch (e) {
          done.fail(e);
        }
      });

    });

  });

  describe('destroy()', () => {

  });

});
