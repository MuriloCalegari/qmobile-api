import * as path from 'path';

export const LOGIN_PAGE = '/index.asp?t=1001';
export const HOME_PAGE = '/index.asp?t=2000';
export const DIARIOS_PAGE = '/index.asp?t=2071';
export const DATA_FOLDER = path.join(__dirname, '../data');
export const PHOTOS_FOLDER = path.join(DATA_FOLDER, './photos');
export const RSA_PAGE = '/lib/rsa/gerador_chaves_rsa.asp?form=frmLogin&action=/qacademico/lib/validalogin.asp';
export const FORM_PAGE = '/lib/validalogin.asp';
