import { UUID } from './../database/uuid';
import { UsuarioService } from './../database/usuario';
import * as express from 'express';
import * as fs from 'fs-extra';
import * as photo from '../services/photo/photo';
import * as fileUpload from 'express-fileupload';
import { SessionService } from '../database/session';

export const photo_router = express.Router();

function removeExtension(name: string) {
  if (name && name.endsWith('.jpg')) {
    return name.substring(0, name.length - 4);
  }
  return name;
}

photo_router.get('/photo/:user', async (req, res) => {
  let { user } = req.params;
  user = removeExtension(user);
  if (!user || user.length !== 36) {
    return res.status(404).end();
  }
  const usuarioDto = await UsuarioService.findById(UUID.from(user));
  if (!usuarioDto) {
    return res.status(404).end();
  }
  res
    .status(200)
    .set('Content-Type', 'image/jpg');

  fs.createReadStream(
    photo.getPath(usuarioDto.id!.toString())
  ).pipe(res);
});

const options = {
  limits: { fileSize: 5e6 }
};

photo_router.post('/photo/:user', fileUpload(options), async (req, res) => {
  let { user } = req.params;
  user = removeExtension(user);
  const session = req.get('X-Session');
  const params = [session, user, req.files];
  if (params.some(param => !param) || user.length !== 36
  || !req.files!.picture || Array.isArray(req.files!.picture!)) {
    return res.status(404).end();
  }

  const sessionDto = await SessionService.findById(UUID.from(session!));
  if (!sessionDto || sessionDto.usuario.toString() !== user) {
    return res.status(401).end();
  }
  const { data } = req.files!.picture! as any;
  const novo = await photo.process(data);
  await fs.writeFile(
    photo.getPath(sessionDto.usuario.toString()),
    novo
  );
  res
    .status(200)
    .set('Content-Type', 'image/jpg')
    .send(novo);
});
