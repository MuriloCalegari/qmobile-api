import * as express from 'express';
import * as Nota from '../models/nota';
import * as path from 'path';
import * as fs from 'fs';
import * as fileUpload from 'express-fileupload';
import * as photo from '../services/photo/photo';
import { PHOTOS_FOLDER } from '../constants';

const uploadConfig = { 
    limits: {
        fileSize: 2e6 /* 2mb */,
        files: 1
    }, 
};

const route = express.Router();

route.get('/picture', (req, res) => {
    const userid = req.userdata.userid;
    const file = path.join(PHOTOS_FOLDER, 'users', userid + '.jpg');
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

route.post('/picture', fileUpload(uploadConfig), (req, res) => {
    if (!req.files || !req.files.picture) {
        return res.status(400)
            .json({
                success: false,
                message: 'Falha ao realizar upload'
            })
    }
    const userid = req.userdata.userid;
    const file: any = req.files.picture;
    const ext = path.extname(file.name.toLowerCase());
    if (allowedExt.indexOf(ext) === -1) {
        return res.status(400)
            .json({
                success: false,
                message: 'Falha ao realizar upload'
            });
    }
    photo.proccess(file.data)
        .then(buffer => photo.savePhoto(buffer, userid))
        .then(buffer => {
            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('Content-Length', buffer.length + '');
            res.end(buffer);
        })
        .catch(err => {
            res.status(400).json({
                success: false,
                message: 'Falha ao realizar upload'
            })
        });
})


export = route;