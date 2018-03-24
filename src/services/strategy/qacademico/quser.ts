import * as cheerio from 'cheerio';
import { QAcademicoStrategy } from './index';
import { HOME_PAGE } from '../../../constants';

export async function getName(strategy: QAcademicoStrategy): Promise<string> {
  try {
    const { endpoint } = strategy;
    const data = await strategy.getUrl(endpoint + HOME_PAGE);
    const dom = cheerio.load(data, { decodeEntities: false });
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
    const { options, endpoint } = strategy;
    const data = await strategy.getUrl(endpoint + HOME_PAGE);

    const dom = cheerio.load(data, { decodeEntities: false });
    const url = dom('.titulo img').attr('src');

    const buffer = await strategy.getFile(url);
    return buffer;
  } catch (exc) {
    await strategy.release(true);
    throw new Error('Falha ao buscar os dados');
  }
}
