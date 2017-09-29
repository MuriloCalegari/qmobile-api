import { Builder, By, until, WebElement } from 'selenium-webdriver';
import * as webdriver from '../driver/webdriver';
import { DIARIOS_PAGE } from '../../constants';

export function openDiarios(browser: webdriver.QBrowser): Promise<webdriver.QBrowser> {
    return new Promise(async (resolve, reject) => {
        const driver = browser.getDriver();
        const diarios = browser.getEndpoint() + DIARIOS_PAGE;
        const url = await driver.getCurrentUrl();
        if (url != diarios) {
            await driver.get(diarios);
        }
        await driver.wait(async () => {
            const readyState = await driver.executeScript('return document.readyState');
            return readyState === 'complete';
        });
        resolve(browser);
    });
}

function readNota(element: WebElement): Promise<Nota> {
    return new Promise(async (resolve, reject) => {
        const tds = await element.findElements(By.tagName('td'));
        resolve({
            descricao: (await tds[1].getText()).replace(/\([a-zA-Z0-9]+\)/g, '').trim(),
            peso: parseFloat((await tds[2].getText()).replace(/[^0-9\.]/g, '')) || -1,
            notamaxima: parseFloat((await tds[3].getText()).replace(/[^0-9\.]/g, '')) || -1,
            nota: parseFloat((await tds[4].getText()).replace(/[^0-9\.]/g, '')) || -1,
        })
    });
}

function readNotas(element: WebElement): Promise<Nota[]> {
    return new Promise(async (resolve, reject) => {
        if ((await element.getAttribute("class")) != 'conteudoTexto') {
            return resolve(null);
        }
        const notas: Nota[] = [];
        const tbody = await element.findElement(By.tagName('tbody'));
        const trs = await tbody.findElements(By.xpath('tr'));
        for (let i = 0; i < trs.length; i++) {
            const tr = trs[i];
            notas.push(await readNota(tr));
        }
        resolve(notas);
    });
}

export function getDisciplinas(browser: webdriver.QBrowser): Promise<Disciplina[]> {
    return new Promise(async (resolve, reject) => {
        const driver = browser.getDriver();
        await openDiarios(browser);
        console.log(await driver.manage().getCookies());
        const tabelaNotas = await driver.findElement(By.xpath('/html/body/table/tbody/tr[2]/td/table/tbody/tr[2]/td[2]/table[2]/tbody/tr/td[2]/p/table[2]/tbody'));
        const trs = await tabelaNotas.findElements(By.xpath('tr'));
        const disciplinas: Disciplina[] = [];
        for (let i = 0; i < trs.length; i++) {
            const tr = trs[i];
            const cl = await tr.getAttribute("class");
            if (cl != 'conteudoTexto' && cl != 'rotulo') {
                const desc = await tr.findElement(By.className("conteudoTexto")).getText();
                const parts = desc.split("-");
                const etapa1 = trs.length > i + 1 ? (await readNotas(trs[i + 1])) : null;
                const etapa2 = etapa1 != null && trs.length > i + 2 ? (await(readNotas(trs[i + 2]))) : null;
                disciplinas.push({
                    turma: parts[1].trim(),
                    nome: parts[2].trim(),
                    professor: parts[3].trim(),
                    etapa1: etapa1 || [],
                    etapa2: etapa2 || []
                });
            }
        }
        resolve(disciplinas);
    });
}