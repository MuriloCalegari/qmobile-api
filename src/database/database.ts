import * as mysql from 'promise-mysql';
import * as fs from 'fs-extra';
import * as path from 'path';
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
        port,
        charset: 'utf8',
        multipleStatements: true
      });

      return connection;
    })());
  }

  export async function createTables(): Promise<void> {
    const db = await DatabaseService.getDatabase();
    const data = await fs.readFile(path.join(__dirname, '../../database.sql'), 'utf-8');
    await db.query(data);
  }

  export async function truncate(tables: string[]): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      const db = await DatabaseService.getDatabase();
      await db.query('SET FOREIGN_KEY_CHECKS = 0;');
      await Promise.all(
        tables.map(table => db.query(`TRUNCATE ${table};`))
      );
      await db.query('SET FOREIGN_KEY_CHECKS = 1;');
    }
  }

}
