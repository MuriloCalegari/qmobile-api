import * as path from 'path';
import * as fs from 'fs-extra';

interface DatabaseConfiguration {
  host: string;
  username?: string;
  password?: string;
  port?: number;
  database: string;
  logging?: boolean;
}

interface RedisConfiguration {
  port: number;
  host: string;
}

interface Configuration {
  cipher_pass: string;
  database: DatabaseConfiguration;
  redis: RedisConfiguration;
  update_queue_size: number;
  max_instances: number;
}

const DEFAULT_CONFIG: Configuration = {
  cipher_pass: '0'.repeat(32),
  database: {
    host: 'localhost',
    username: 'root',
    password: '12345',
    port: 3306,
    database: 'qmobile',
    logging: false
  },
  redis: {
    port: 6379,
    host: 'localhost'
  },
  update_queue_size: 50,
  max_instances: 40
};

export namespace ConfigurationService {

  export const CONFIG_PATH = path.join(__dirname, '../data/config.json');
  let configPromise: Promise<Configuration>;

  export async function getConfig(): Promise<Configuration> {
    return configPromise || (configPromise = (async () => {

      let config = DEFAULT_CONFIG;

      if (!await fs.pathExists(CONFIG_PATH)) {
        await fs.writeFile(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 4), 'utf8');
      } else {
        config = JSON.parse(await fs.readFile(CONFIG_PATH, 'utf8'));
      }

      if (process.env) {
        config.cipher_pass = process.env.ENCRYPTION_KEY || config.cipher_pass;
        config.database.host = process.env.MYSQL_HOST || config.database.host;
        config.database.username = process.env.MYSQL_USER || config.database.username;
        config.database.password = process.env.MYSQL_PASSWORD || config.database.password;
        config.database.database = process.env.MYSQL_DB || config.database.database;
        config.database.port =
          (process.env.MYSQL_PORT && parseInt(process.env.MYSQL_PORT, 10)) ||
          config.database.port;

        config.redis.host = process.env.REDIS_HOST || config.redis.host;
        config.redis.port = (process.env.REDIS_PORT && parseInt(process.env.REDIS_PORT, 10)) ||
          config.redis.port;
      }
      return config;

    })());
  }

}
