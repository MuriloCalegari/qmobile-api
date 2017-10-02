import * as Usuario from '../../models/usuario';
import * as session from './session';
import * as qauth from '../../services/browser/qauth';
import * as quser from '../../services/browser/quser';

function insereBanco(username, nome, pass): Promise<any> {
    return <any> Usuario.create({
        matricula: username,
        nome: nome,
        password: pass
    })
}

namespace a {
    export interface LoginResult {
        newbie: boolean;
        name: string;
        sessionid: string;
    }
    export function login(endpoint: string, username: string, pass: string): Promise<LoginResult> {
        const res: LoginResult = {
            newbie: true,
            name: null,
            sessionid: null
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
                            .then(quser.getName)
                            .then(nome => {
                                res.name = nome;
                                return insereBanco(username, nome, pass)
                            });
            } else {
                return Promise.resolve(user);
            }
        })
        .then(user => session.createSession(user.id))
        .then(sessionid => {
            res.sessionid = sessionid;
            return Promise.resolve(res)
        });
    }
}
export = a;