import { UserData } from './../middlewares/endpoint';
import { Disciplina } from './../models/disciplina';
import { Usuario } from './../models/usuario';
import * as express from 'express';
import { Nota } from '../models/nota';

const route = express.Router();

route.get('/', async (req, res) => {

  const userdata = (req as any).userdata as UserData;
  const { usuario } = userdata.session;
  const disciplinas = await usuario.$get<Disciplina>('disciplinas') as Disciplina[];
  Promise.all(
    disciplinas.map(async disciplina => {
      const cond = {
        userid: usuario.id,
        disciplinaid: disciplina.id,
      };
      const etapas = (await Promise.all(
        [1, 2].map(
          etapa => Nota.count(
            { where: { ...cond, etapa } }
          )
        )
      )).filter(val => val > 0);
      return {
        id: disciplina.id,
        nome: disciplina.nome,
        professor: disciplina.professor,
        turma: disciplina.turma.codigo,
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
