import * as crypto from 'crypto';

const ALGORITHM = "aes-256-ctr";

namespace c {
    export function crypt(str: string, pass: string): string {
        const cipher = crypto.createCipher(ALGORITHM, pass);
        let crypted = cipher.update(str, 'utf8', 'hex');
        crypted += cipher.final('hex');
        return crypted;
    }
    export function decrypt(str: string, pass: string): string {
        const decipher = crypto.createDecipher(ALGORITHM, pass);
        let dec = decipher.update(str, 'hex' ,'utf8');
        dec += decipher.final('utf8');
        return dec;
    }
}

export = c;