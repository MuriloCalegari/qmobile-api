import { QAcademicoStrategy } from './index';
import { LOGIN_PAGE } from '../../../constants';

export async function login(strategy: QAcademicoStrategy, username: string, password: string): Promise<void> {
  try {
    const { page, endpoint } = strategy;
    await page.goto(endpoint + LOGIN_PAGE);

    const form = await page.waitForSelector('[name=frmLogin]');
    const submit = await page.waitForSelector('[name=Submit]');
    await (await form.$('[name=LOGIN]'))!.type(username);
    await (await form.$('[name=SENHA]'))!.type(password);
    await submit!.click();

    await page.waitForNavigation();

    const titulo = await page.title();
    if (!titulo.toLowerCase().includes('bem vindo')) {
      throw new Error('Senha incorreta');
    }
  } catch (e) {
    if (e.message !== 'Senha incorreta') {
      try {
        await strategy.release(true);
      } catch { }
    }
    throw e;
  }
}
