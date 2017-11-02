import { Builder, By, until, WebElement } from 'selenium-webdriver';
import * as webdriver from '../driver/webdriver';
import * as cheerio from 'cheerio';
import { DIARIOS_PAGE } from '../../constants';

export function openDiarios(browser: webdriver.QBrowser): Promise<webdriver.QBrowser> {
    return new Promise(async (resolve, reject) => {
        try {
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
        } catch (e) {
            await browser.exit(true);
            reject();
        }
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

function readNota(dom: CheerioStatic, preelem: CheerioElement): Nota {
    const element = dom(preelem);
    const tds = element.children('td');
    return {
        descricao: (
            tds.eq(1).text()
        ).replace(/\([a-zA-Z0-9]+\)/g, '').replace(/\s\s+/g, ' ').trim(),
        peso: extractFloat(tds.eq(2).text()),
        notamaxima: extractFloat(tds.eq(3).text()),
        nota: extractFloat(tds.eq(4).text()),
    };
}

function readEtapa(dom: CheerioStatic, preelem: CheerioElement): Etapa {
    const element = dom(preelem);
    if (!element.hasClass("conteudoTexto")) {
        return null;
    }
    const numEtapa = extractInt(element.find("div.conteudoTitulo").text());
    const tbody = element.find('tbody');
    const trs = tbody.children('tr');
    const notas = [].map.call(trs, tr => readNota(dom, tr));
    return {
        numero: numEtapa,
        notas: notas
    }
}

export function getDisciplinas(browser: webdriver.QBrowser): Promise<Disciplina[]> {
    return new Promise(async (resolve, reject) => {
        try {
            const driver = browser.getDriver();
            await openDiarios(browser);
            const dom = cheerio.load(await driver.getPageSource());
            const tabelaNotas = dom('table tr:nth-child(2) > td > table tr:nth-child(2) > td:nth-child(2) > table:nth-child(3) > tbody td:nth-child(2) table:nth-child(3) > tbody');
            const trs = tabelaNotas.children("tr").toArray();
            const disciplinas: Disciplina[] = [];
            trs.forEach((elem, i) => {
                const tr = dom(elem);
                if (!tr.hasClass('conteudoTexto') && !tr.hasClass('rotulo')) {
                    const descricao = tr.find("td.conteudoTexto").text();
                    const parts = descricao.split("-");
                    const etapas: Etapa[] = [];
                    for (let j = 1; j <= 2 && i + j < trs.length; j++) {
                        const etapa = readEtapa(dom, trs[i + j]);
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
            });
            resolve(disciplinas);
        } catch (e) {
            await browser.exit(true);
            reject();
        }
    });
}