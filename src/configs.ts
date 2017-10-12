import * as path from 'path';
import * as fs from 'fs';

let obj = {
    cipher_pass: '123mudar',
    db: {
        host: 'localhost',
        username: 'postgres',
        password: '12345',
        port: 5432,
        database: 'qmobile'
    },
    tests: {
        endpoint: null,
        login: null,
        password: null,
        name: null
    }
};

const cfgpath = path.join(__dirname, '../config.json');

if (!fs.existsSync(cfgpath)) {
    fs.writeFileSync(cfgpath, JSON.stringify(obj, null, 4), 'utf8');
    console.error("Altere as configurações em " + cfgpath);
    process.exit(1);
} else {
    try {
        obj = JSON.parse(fs.readFileSync(cfgpath, 'utf8'));
    } catch (e) {
        console.error("Altere as configurações em " + cfgpath);
        process.exit(1);
    }
}

export = obj;