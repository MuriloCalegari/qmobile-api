import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { PHOTOS_FOLDER } from '../../constants';

export function proccess(buffer: Buffer): Promise<Buffer> {
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

export function savePhoto(buffer: Buffer, userid: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const filePath = path.join(PHOTOS_FOLDER, 'users', userid + '.jpg');
        fs.writeFile(filePath, buffer, err => {
            if (err)
                return reject(err);
            resolve(buffer);
        })
    })
}