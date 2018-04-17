import { DisciplinaExtras } from './../../../database/disciplina';
import { BoletimDto } from './../../../database/boletim';
import { NotaService } from './../../../database/nota';
import { NumeroEtapa } from '../../../services/strategy/factory';

type Boletim = BoletimDto & DisciplinaExtras;

export = {

  schema: `
  enum Situacao {
    APROVADO
    REPROVADO
    CURSANDO
  }

  type Boletim {
    situacao: Situacao!
    etapa1: Float
    etapa2: Float
    rp_etapa1: Float
    rp_etapa2: Float
  }
  `,

  resolvers: {

    Boletim: {
      situacao(boletim: Boletim, _, c): string {
        return (boletim.situacao || 'Cursando').toUpperCase();
      },
      async etapa1(boletim: Boletim, _, c): Promise<number> {
        if (!boletim.etapa1 || boletim.etapa1 < 0) {
          const media = await NotaService.getMediaDisciplina(boletim.ud, NumeroEtapa.ETAPA1);
          return media;
        }
        return boletim.etapa1;
      },
      async etapa2(boletim: Boletim, _, c): Promise<number> {
        if (!boletim.etapa2 || boletim.etapa2 < 0) {
          const media = await NotaService.getMediaDisciplina(boletim.ud, NumeroEtapa.ETAPA2);
          return media;
        }
        return boletim.etapa2;
      },
      async rp_etapa1(boletim: Boletim, _, c): Promise<number> {
        if (!boletim.rp_etapa1 || boletim.rp_etapa1 < 0) {
          const media = await NotaService.getMediaDisciplina(boletim.ud, NumeroEtapa.RP_ETAPA1);
          return media;
        }
        return boletim.rp_etapa1;
      },
      async rp_etapa2(boletim: Boletim, _, c): Promise<number> {
        if (!boletim.rp_etapa2 || boletim.rp_etapa2 < 0) {
          const media = await NotaService.getMediaDisciplina(boletim.ud, NumeroEtapa.RP_ETAPA2);
          return media;
        }
        return boletim.rp_etapa2;
      }
    }

  }

};
