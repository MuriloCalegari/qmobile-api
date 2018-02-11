import * as express from 'express';
import * as Nota from '../models/nota';
import * as path from 'path';
import * as fs from 'fs';
import * as fileUpload from 'express-fileupload';
import * as photo from '../services/photo/photo';
import { UserData } from '../middlewares/endpoint';

const uploadConfig = {
  limits: {
    fileSize: 2e6 /* 2mb */,
    files: 1
  },
};

const route = express.Router();

route.get('/picture', (req, res) => {
  const { usuario } = ((req as any).userdata as UserData).session;
  const userid = usuario.id;
  const file = photo.getPath(userid);
  fs.exists(file, exists => {
    if (!exists)
      return res.status(404)
        .json({
          success: false,
          message: 'Foto não encontrada'
        })
    console.log(file);
    res.sendFile(file);
  })
});

const allowedExt = ['.jpeg', '.jpg', '.bmp', '.png'];

route.post('/picture', fileUpload(uploadConfig), async (req, res) => {
  if (!req.files || !req.files.picture) {
    return res.status(400)
      .json({
        success: false,
        message: 'Falha ao realizar upload'
      })
  }
  const { usuario } = ((req as any).userdata as UserData).session;
  const userid = usuario.id;
  const file: any = req.files.picture;
  const ext = path.extname(file.name.toLowerCase());
  if (allowedExt.includes(ext)) {
    return res.status(400)
      .json({
        success: false,
        message: 'Falha ao realizar upload'
      });
  }
  try {
    const buffer = await photo.process(file.data);
    photo.savePhoto(buffer, userid);
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Length', `${buffer.length}`);
    res.end(buffer);
  } catch {
    res.status(400).json({
      success: false,
      message: 'Falha ao realizar upload'
    })
  }
})


export = route;
