import * as Session from '../../models/session';

namespace s {
    export function createSession(userid, instanceid = ''): Promise<string> {
        return <any> Session.create({
            instanceid: instanceid
        }).then((ses: any) => Promise.resolve(ses.id));
    }
}
export = s;