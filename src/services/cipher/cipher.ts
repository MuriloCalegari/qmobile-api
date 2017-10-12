import * as crypto from 'crypto';

const ALGORITHM = "aes-256-ctr";

namespace c {
    export function cipher(str: string, pass: string): string {
        const cipher = crypto.createCipher(ALGORITHM, pass);
        let ciphered = cipher.update(str, 'utf8', 'hex');
        ciphered += cipher.final('hex');
        return ciphered;
    }
    export function decipher(str: string, pass: string): string {
        const decipher = crypto.createDecipher(ALGORITHM, pass);
        let dec = decipher.update(str, 'hex' ,'utf8');
        dec += decipher.final('utf8');
        return dec;
    }
}

export = c;