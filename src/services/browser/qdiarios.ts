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

export interface Disciplina {
    id?: string;
    turma: string;
    nome: string;
    professor: string;
    etapas: Etapa[];
}

export interface Etapa {
    numero: number;
    notas: Nota[];
}

export interface Nota {
    id?: string;
    descricao: string;
    peso: number;
    notamaxima: number;
    nota: number;
}

function extractFloat(val: string): number {
    return parseFloat(val.replace(/[^0-9\.]/g, '')) || -1;
}

function extractInt(val: string): number {
    return parseInt(val.replace(/[^0-9]/g, '')) || -1;
}

function readNota(element: WebElement): Promise<Nota> {
    return new Promise(async (resolve, reject) => {
        const tds = await element.findElements(By.tagName('td'));
        resolve({
            descricao: (
                await tds[1].getText()
            ).replace(/\([a-zA-Z0-9]+\)/g, '').trim(),
            peso: extractFloat(await tds[2].getText()),
            notamaxima: extractFloat(await tds[3].getText()),
            nota: extractFloat(await tds[4].getText()),
        })
    });
}

function readEtapa(element: WebElement): Promise<Etapa> {
    return new Promise(async (resolve, reject) => {
        if ((await element.getAttribute("class")) != 'conteudoTexto') {
            return resolve(null);
        }
        const notas: Nota[] = [];
        const numEtapa = extractInt(await element.findElement(By.className("conteudoTitulo")).getText());
        const tbody = await element.findElement(By.tagName('tbody'));
        const trs = await tbody.findElements(By.xpath('tr'));
        for (let i = 0; i < trs.length; i++) {
            const tr = trs[i];
            notas.push(await readNota(tr));
        }
        resolve({
            numero: numEtapa,
            notas: notas
        });
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
                const etapas: Etapa[] = [];
                for (let j = 1; j <= 2 && i + j < trs.length; j++) {
                    const etapa = await readEtapa(trs[i + j]);
                    if (etapa !== null) {
                        etapas.push(etapa);
                    } else {
                        break;
                    }
                }
                disciplinas.push({
                    turma: parts[1].trim(),
                    nome: parts[2].trim(),
                    professor: parts[3].trim(),
                    etapas: etapas
                });
            }
        }
        resolve(disciplinas);
    });
}