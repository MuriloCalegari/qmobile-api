import * as cheerio from 'cheerio';
import { QAcademicoStrategy } from './index';
import { HOME_PAGE } from '../../../constants';

async function openHome(strategy: QAcademicoStrategy): Promise<void> {
  try {
    const { page, endpoint } = strategy;
    const home = endpoint + HOME_PAGE;
    const url = await page.url();
    if (url !== home) {
      await page.goto(home);
    }
  } catch (exc) {
    await strategy.release(true);
    throw new Error('Falha ao acessar ao servidor.');
  }
}

export async function getName(strategy: QAcademicoStrategy): Promise<string> {
  try {
    const { page } = strategy;
    await openHome(strategy);
    const dom = cheerio.load(await page.content());
    const nome = dom('.barraRodape').eq(1).text().trim();
    if (!!nome) {
      return nome;
    } else {
      throw new Error('Name not found');
    }
  } catch (exc) {
    await strategy.release(true);
    throw new Error('Falha ao buscar os dados');
  }
}

export async function getPhoto(strategy: QAcademicoStrategy): Promise<Buffer> {
  try {
    const { page } = strategy;
    await openHome(strategy);
    const base64 = (<string>await page.evaluate(`

      const c = document.createElement('canvas');
      const ctx = c.getContext('2d');
      const img = document.querySelector('.titulo img');
      c.width = img.naturalWidth || img.width;
      c.height = img.naturalHeight || img.height;
      ctx.drawImage(img, 0, 0, c.width, c.height);
      c.toDataURL();

    `)).replace(/^data:image\/png;base64,/, '');
    return new Buffer(base64, 'base64');
  } catch (exc) {
    await strategy.release(true);
    throw new Error('Falha ao buscar os dados');
  }
}
