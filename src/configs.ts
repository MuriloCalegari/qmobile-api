import * as path from 'path';
import * as fs from 'fs';

let def = {
    cipher_pass: '123mudar',
    db: {
        host: 'localhost',
        username: 'postgres',
        password: '12345',
        port: 5432,
        database: 'qmobile',
        logging: false
    },
    tests: {
        endpoint: null,
        login: null,
        password: null,
        name: null
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
        def = null;
    }
}

export = def;