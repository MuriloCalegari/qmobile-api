import * as mysql from 'promise-mysql';
import { ConfigurationService } from '../configs';

export namespace DatabaseService {

  let connectionPromise: Promise<mysql.Connection>;

  export function getDatabase(): Promise<mysql.Connection> {
    return connectionPromise || (connectionPromise = (async () => {
      const {
        database: {
          host,
          username,
          password,
          port,
          database
        }
      } = await ConfigurationService.getConfig();

      const connection = await mysql.createConnection({
        host,
        user: username,
        password,
        database,
        port
      });

      return connection;
    })());
  }

}
