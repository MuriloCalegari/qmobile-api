import * as path from 'path';
import * as fs from 'fs';
import * as deepAssign from 'deep-assign';


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
    update_queue_size: 50
};

let obj = null;

const cfgpath = path.join(__dirname, '../config.json');

if (!fs.existsSync(cfgpath)) {
    fs.writeFileSync(cfgpath, JSON.stringify(def, null, 4), 'utf8');
} else {
    try {
        obj = JSON.parse(fs.readFileSync(cfgpath, 'utf8'));
    } catch (e) {
        obj = null;
    }
}

if (obj !== null) {
    def = deepAssign(def, obj);
    fs.writeFileSync(cfgpath, JSON.stringify(def, null, 4), 'utf8');
} else {
    def = null;
}

export = def;