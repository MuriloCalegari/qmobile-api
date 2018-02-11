import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-ctr';

export function cipher(str: string, pass: string): string {
  const cipherobj = crypto.createCipher(ALGORITHM, pass);
  let ciphered = cipherobj.update(str, 'utf8', 'hex');
  ciphered += cipherobj.final('hex');
  return ciphered;
}

export function decipher(str: string, pass: string): string {
  const decipherobj = crypto.createDecipher(ALGORITHM, pass);
  let dec = decipherobj.update(str, 'hex', 'utf8');
  dec += decipherobj.final('utf8');
  return dec;
}
