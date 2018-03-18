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

interface Configuration {
  cipher_pass: string;
  database: DatabaseConfiguration;
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

      config.cipher_pass = (process.env && process.env.ENCRYPTION_KEY) || config.cipher_pass;
      return config;

    })());
  }

}
