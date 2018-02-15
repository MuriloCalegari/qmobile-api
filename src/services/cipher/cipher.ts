import * as crypto from 'crypto';

const IV_LENGTH = 16;

export function crypt(text: string, key: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', new Buffer(key), iv);
  let encrypted = cipher.update(text as any);

  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string, key: string): string {
  const textParts = text.split(':');
  const iv = new Buffer(textParts.shift() as string, 'hex');
  const encryptedText = new Buffer(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', new Buffer(key), iv);
  let decrypted = decipher.update(encryptedText);

  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}
