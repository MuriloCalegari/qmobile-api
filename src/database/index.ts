import { Db, MongoClient } from 'mongodb';
import { ConfigurationService } from '../configs';

export namespace DatabaseService {

  let client: MongoClient;
  let dbPromise: Promise<Db>;

  export function getDatabase(): Promise<Db> {
    return dbPromise || (dbPromise = (async () => {

      const {
        database: {
          host,
          username,
          password,
          port,
          database
        }
      } = await ConfigurationService.getConfig();
      const auth = username && password ? `${username}:${password}@` : '';
      client = await MongoClient.connect(`mongodb://${auth}${host}:${port || 27017}`);
      return client.db(database);

    })());
  }

}
