import * as path from 'path';
import * as fs from 'fs';

interface DatabaseConfiguration {
  host: string;
  username: string;
  password: string;
  port: number;
  database: string;
  logging?: boolean;
}

interface Configuration {
  cipher_pass: string;
  db: DatabaseConfiguration;
  serverport: number;
  update_queue_size: number;
  maxinstances: number;
}

let def: Configuration = {
  cipher_pass: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  db: {
    host: 'localhost',
    username: 'postgres',
    password: '12345',
    port: 5432,
    database: 'qmobile',
    logging: false
  },
  serverport: 3010,
  update_queue_size: 50,
  maxinstances: 40
};


const cfgpath = path.join(__dirname, '../config.json');

if (!fs.existsSync(cfgpath)) {
  fs.writeFileSync(cfgpath, JSON.stringify(def, null, 4), 'utf8');
} else {
  try {
    def = JSON.parse(fs.readFileSync(cfgpath, 'utf8'));
  } catch (e) {
    def = null as any;
  }
}

def.cipher_pass = (process.env && process.env.ENCRYPTION_KEY) || def.cipher_pass;

export = def;
