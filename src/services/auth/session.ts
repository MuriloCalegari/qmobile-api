import { Session } from '../../models/session';


export async function createSession(userid: string, instanceid = ''): Promise<string> {
  const ses = await Session.create({ instanceid, userid });
  return ses.id;
}

export async function destroySession(id: string): Promise<void> {
  await Session.destroy({
    where: { id }
  });
}
