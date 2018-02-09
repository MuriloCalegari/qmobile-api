import { Disciplina } from './../models/disciplina';
import { Usuario } from './../models/usuario';
import * as express from 'express';
import { Nota } from '../models/nota';
const route = express.Router();

route.get('/', async (req, res) => {

  const user = await Usuario.findById(req.userdata.userid) as Usuario;
  const disciplinas = await user.$get<Disciplina>('disciplinas') as Disciplina[];
  Promise.all(
    disciplinas.map(async disciplina => {
      const etapas = [];
      const where = {
        userid: req.userdata.userid,
        disciplinaid: disciplina.id,
        etapa: 1
      };
      if (await Nota.findOne({ where })) {
        etapas.push(1);
      }
      where.etapa = 2;
      if (await Nota.findOne({ where })) {
        etapas.push(2);
      }
      return {
        id: disciplina.id,
        nome: disciplina.nome,
        professor: disciplina.professor,
        turma: disciplina.turma.id,
        etapas: etapas
      };
    })
  ).then(resultado => {
    res.json({
      success: true,
      disciplinas: resultado
    })
  }).catch(err => {
    res.status(500).json({
      success: false,
      message: 'Erro no servidor, tente novamente mais tarde'
    })
  })
})

export = route;
