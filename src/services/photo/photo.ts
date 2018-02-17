import * as sharp from 'sharp';
import * as fs from 'fs-extra';
import * as path from 'path';
import { PHOTOS_FOLDER } from '../../constants';
import { promisify } from 'util';

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

export async function savePhoto(buffer: Buffer, userid: string): Promise<void> {
  if (!await fs.pathExists(PHOTOS_FOLDER)) {
    await fs.mkdir(PHOTOS_FOLDER);
    const users = path.join(PHOTOS_FOLDER, 'users');
    if (!await fs.pathExists(users)) {
      await fs.mkdir(users);
    }
  }
  await fs.writeFile(getPath(userid), buffer);
}
