import * as Usuario from '../../models/usuario';
import * as qauth from '../../services/browser/qauth';
import * as quser from '../../services/browser/quser';
import { QError } from '../../services/errors/errors';
import * as configs from '../../configs';
import * as crypto from '../crypt/crypto';
import { QBrowser } from '../driver/webdriver';

function insereBanco(endpoint, username, nome, pass): Promise<any> {
    const hash = crypto.crypt(pass, configs.crypt_pass);
    return <any> Usuario.create({
        matricula: username,
        nome: nome,
        password: hash,
        endpoint: endpoint
    })
}

namespace a {
    export interface LoginResult {
        newbie: boolean;
        name: string;
        userid: string;
        browser?: QBrowser
    }
    export function login(endpoint: string, username: string, pass: string): Promise<LoginResult> {
        const res: LoginResult = {
            newbie: false,
            name: null,
            userid: null,
            browser: null
        }
        return <any> Usuario.findOne({
            where: {
                matricula: username
            }
        })
        .then(user => {
            if (!user) {
                res.newbie = true;
                return qauth.login(endpoint, username, pass)
                            .then(browser => res.browser = browser)
                            .then(browser => quser.getName(browser))
                            .then(nome => {
                                res.name = nome;
                                return insereBanco(endpoint, username, nome, pass)
                            });
            } else {
                return Promise.resolve(user);
            }
        })
        .then(user => {
            const hash = crypto.crypt(pass, configs.crypt_pass);
            if (user.password === hash) {
                res.name = user.nome;
                res.userid = user.id;
                return Promise.resolve(res);
            }
            return Promise.reject(new QError('Senha incorreta'));
        });
    }
}
export = a;