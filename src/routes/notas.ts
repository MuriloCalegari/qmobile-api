import * as express from 'express';
import { Nota } from '../models/nota';
import { UserData } from '../middlewares/endpoint';
const route = express.Router();

route.get('/:nota', async (req, res) => {
  const { usuario } = ((req as any).userdata as UserData).session;
  if (!req.params.nota) {
    return res.status(400).json({
      success: false,
      message: 'Nota não encontrada'
    })
  }
  try {
    const { nota } = req.params;
    const resnota = await Nota.findOne({
      where: {
        id: nota,
        userid: usuario.id
      }
    });
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
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Erro no servidor, tente novamente mais tarde'
    });
  }
})

route.get('/:disciplina/:etapa', async (req, res) => {
  if (!req.params.disciplina || !req.params.etapa) {
    return res.status(400).json({
      success: false,
      message: 'Etapa não encontrada'
    })
  }
  const { usuario } = ((req as any).userdata as UserData).session;
  const { disciplina } = req.params;
  const etapa = parseInt(req.params.etapa, 10) || -1;
  if (etapa < 1 || etapa > 2) {
    return res.status(400).json({
      success: false,
      message: 'Etapa não encontrada'
    });
  }
  try {
    const resnotas = (await Nota.findAll({
      where: {
        disciplinaid: disciplina,
        etapa: etapa,
        userid: usuario.id
      }
    })).map(nota => ({
      id: nota.id,
      descricao: nota.descricao,
      peso: nota.peso,
      notamaxima: nota.notamaxima,
      nota: nota.nota
    }));
    res.json({
      success: true,
      notas: resnotas
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Erro no servidor, tente novamente mais tarde'
    });
  }
})

export = route;
