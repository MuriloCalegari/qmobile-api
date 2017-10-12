import * as express from 'express';
import * as Disciplina from '../models/disciplina';
import * as Nota from '../models/nota';
import * as Usuario from '../models/usuario';
const route = express.Router();

route.get('/', (req, res) => {
    Usuario.findById(req.userdata.userid)
        .then((user: any) => user.getDisciplinas())
        .then((disciplinas: any[]) => {
            const resultado = [];
            const proms = [];
            disciplinas.forEach(disc => {
                const etapas = [];
                resultado.push({
                    id: disc.id,
                    nome: disc.nome,
                    professor: disc.professor,
                    turma: disc.codturma,
                    etapas: etapas
                })
                proms.push(Nota.findOne({
                        where: {
                            userid: req.userdata.userid,
                            disciplinaid: disc.id,
                            etapa: 1
                        }
                    }).then(resp => {
                        if (resp) 
                            etapas.push(1)
                    }))
                proms.push(Nota.findOne({
                        where: {
                            userid: req.userdata.userid,
                            disciplinaid: disc.id,
                            etapa: 2
                        }
                    }).then(resp => {
                        if (resp) 
                            etapas.push(2)
                    }))
            })
            Promise.all(proms)
                .then(() => res.json({
                        success: true,
                        disciplinas: resultado
                    }))
        })
        .catch(err => {
            res.status(500).json({
                success: false,
                message: 'Erro no servidor, tente novamente mais tarde'
            })
        })
})

export = route;