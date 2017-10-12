import * as Session from '../../models/session';

namespace s {
    export function createSession(userid, instanceid = ''): Promise<string> {
        return <any> Session.create({
            instanceid: instanceid,
            userid: userid
        }).then((ses: any) => ses.id);
    }
}
export = s;