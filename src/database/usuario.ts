import { ObjectID } from 'bson';
import { DatabaseService } from './index';

export interface Usuario {
  _id?: ObjectID;
  matricula: string;
  nome: string;
  password: string;
  endpoint: string;
}

export namespace UsuarioService {

  export async function createUser(user: Usuario): Promise<ObjectID> {
    const db = await DatabaseService.getDatabase();
    const res = await db.collection('usuarios').insertOne(user);
    return res && res.insertedId;
  }

  export async function getUserById(id: string | ObjectID): Promise<Usuario | null> {
    if (typeof id === 'string') {
      id = ObjectID.createFromHexString(id);
    }
    const db = await DatabaseService.getDatabase();
    return await db.collection('usuarios').findOne({
      id
    });
  }

  export async function getUserByMatricula(matricula: string): Promise<Usuario | null> {
    const db = await DatabaseService.getDatabase();
    return await db.collection('usuarios').findOne({
      matricula
    });
  }

}
