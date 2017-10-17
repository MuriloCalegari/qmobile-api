import * as Session from '../../models/session';

namespace s {

    export function createSession(userid, instanceid = ''): Promise<string> {
        return <any> Session.create({
            instanceid: instanceid,
            userid: userid
        }).then((ses: any) => ses.id);
    }

    export function destroySession(sessionid: string): Promise<void> {
        return <any> Session.destroy({
            where: {
                id: sessionid
            }
        });
    }
    
}
export = s;