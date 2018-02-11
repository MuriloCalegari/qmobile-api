import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { PHOTOS_FOLDER } from '../../constants';

export function process(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .background('white')
    .resize(500, 500)
    .embed()
    .flatten()
    .jpeg({
      quality: 100
    })
    .toBuffer();
}

export function getPath(userid: string): string {
  return path.join(PHOTOS_FOLDER, 'users', `${userid}.jpg`);
}

export function savePhoto(buffer: Buffer, userid: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    fs.writeFile(getPath(userid), buffer, err => {
      if (err)
        return reject(err);
      resolve(buffer);
    })
  })
}
