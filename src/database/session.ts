import { ObjectID } from 'bson';
import { DatabaseService } from './index';

export interface Session {
  _id?: ObjectID;
  usuario: ObjectID;
  instance_id?: string;
}

export namespace SessionService {

  export async function createSession(session: Session): Promise<ObjectID> {
    const db = await DatabaseService.getDatabase();
    const res = await db.collection('sessions').insertOne(session);
    return res && res.insertedId;
  }

  export async function getSessionById(id: string | ObjectID): Promise<Session | null> {
    if (typeof id === 'string') {
      id = ObjectID.createFromHexString(id);
    }
    const db = await DatabaseService.getDatabase();
    return await db.collection('sessions').findOne({
      id
    });
  }

  export async function getSessionsByUser(userId: string | ObjectID): Promise<Session[]> {
    if (typeof userId === 'string') {
      userId = ObjectID.createFromHexString(userId);
    }
    const db = await DatabaseService.getDatabase();
    return await db.collection('sessions')
      .find({ usuario: userId })
      .toArray();
  }

}
