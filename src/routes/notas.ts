import * as express from 'express';
import * as Nota from '../models/nota';
const route = express.Router();

route.get('/:nota', (req, res) => {
    if (!req.params.nota) {
        return res.status(400).json({
            success: false,
            message: 'Nota não encontrada'
        })
    }
    const notaid = req.params.nota;
    Nota.findOne({
        where: {
            id: notaid,
            userid: req.userdata.userid
        }
    })
    .then((resnota: any) => {
        if (resnota) {
            res.json({
                success: true,
                nota: {
                    id: resnota.id,
                    descricao: resnota.descricao,
                    peso: resnota.peso,
                    notamaxima: resnota.notamaxima,
                    nota: resnota.nota
                }
            })
        } else {
            res.status(400).json({
                success: false,
                message: 'Nota não encontrada'
            })
        }
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Erro no servidor, tente novamente mais tarde'
        })
    })
})

route.get('/:disciplina/:etapa', (req, res) => {
    if (!req.params.disciplina || !req.params.etapa) {
        return res.status(400).json({
            success: false,
            message: 'Etapa não encontrada'
        })
    }
    const disciplina = req.params.disciplina;
    let etapa = -1;
    try {
        etapa = parseInt(req.params.etapa, 10);
    } catch (e) {}
    if (etapa < 1 || etapa > 2) {
        return res.status(400).json({
            success: false,
            message: 'Etapa não encontrada'
        });
    }
    Nota.findAll({
        where: {
            disciplinaid: disciplina,
            etapa: etapa,
            userid: req.userdata.userid
        }
    })
    .then((notas: any[]) => {
        const resnotas = [];
        notas.forEach(nota => {
            resnotas.push({
                id: nota.id,
                descricao: nota.descricao,
                peso: nota.peso,
                notamaxima: nota.notamaxima,
                nota: nota.nota
            })
        });
        res.json({
            success: true,
            notas: resnotas
        })
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Erro no servidor, tente novamente mais tarde'
        })
    })
})

export = route;