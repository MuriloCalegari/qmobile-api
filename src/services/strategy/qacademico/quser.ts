import * as cheerio from 'cheerio';
import axios from 'axios';
import { QAcademicoStrategy } from './index';
import { HOME_PAGE } from '../../../constants';

export async function getName(strategy: QAcademicoStrategy): Promise<string> {
  try {
    const { endpoint } = strategy;
    const { data } = await strategy.getUrl(endpoint + HOME_PAGE);
    const dom = cheerio.load(data);
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
    const { data } = await strategy.getUrl(endpoint + HOME_PAGE);

    const dom = cheerio.load(data);
    const url = dom('.titulo img').attr('src');

    const { data: buffer } = await axios.get<Buffer>(url, {
      ...options,
      responseType: 'arraybuffer'
    });
    return buffer;
  } catch (exc) {
    await strategy.release(true);
    throw new Error('Falha ao buscar os dados');
  }
}
