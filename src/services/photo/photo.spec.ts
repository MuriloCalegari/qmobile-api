import * as imageSize from 'image-size';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as photoService from './photo';
import { PHOTOS_FOLDER } from '../../constants';

const PHOTO_PATH = path.join(__dirname, '../../../test/assets/user.png');
const SAVE_FOLDER = path.join(PHOTOS_FOLDER, 'users/test.jpg');

describe('PhotoService', () => {

  let original: Buffer;

  beforeAll(async done => {
    original = await fs.readFile(PHOTO_PATH);
    done();
  });

  it('process() deve redimensionar a imagem para 500x500', async done => {
    try {
      const osize = imageSize(original);
      expect(osize.height).not.toBe(500);
      expect(osize.width).not.toBe(500);

      const changed = await photoService.process(original);
      const csize = imageSize(changed);
      expect(csize.height).toBe(500);
      expect(csize.width).toBe(500);

      done();
    } catch (e) {
      done.fail(e);
    }
  });

  describe('savePhoto()', () => {

    beforeEach(() => {
      spyOn(fs, 'writeFile').and.returnValue(Promise.resolve());
      spyOn(fs, 'pathExists').and.returnValue(Promise.resolve(true));
      spyOn(fs, 'mkdir').and.returnValue(Promise.resolve());
    });

    it('deve criar subpasta de fotos', async done => {
      try {
        let i = 0;
        (fs.pathExists as jasmine.Spy).and.callFake(() => {
          i++;
          return i === 1 ? Promise.resolve(false) : Promise.resolve(true);
        });
        await photoService.savePhoto(original, 'test');

        expect(fs.mkdir).toHaveBeenCalledWith(path.join(SAVE_FOLDER, '../..'));
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('deve criar subpasta de usuários', async done => {
      try {
        (fs.pathExists as jasmine.Spy).and.returnValue(Promise.resolve(false));
        await photoService.savePhoto(original, 'test');

        expect(fs.mkdir).toHaveBeenCalledWith(path.join(SAVE_FOLDER, '../..'));
        expect(fs.mkdir).toHaveBeenCalledWith(path.join(SAVE_FOLDER, '..'));
        done();
      } catch (e) {
        done.fail(e);
      }
    });

    it('deve salvar a foto na pasta de fotos', async done => {
      try {
        await photoService.savePhoto(original, 'test');
        expect(fs.writeFile).toHaveBeenCalledWith(SAVE_FOLDER, original);
        done();
      } catch (e) {
        done.fail(e);
      }
    });

  });

});
