import { QAcademicoStrategy } from './qacademico/index';

export enum NumeroEtapa {
  ETAPA1 = 1,
  ETAPA2 = 2,
  RP_ETAPA1 = 3,
  RP_ETAPA2 = 4
}

export interface RemoteDisciplina {
  turma: string;
  nome: string;
  professor: string;
  periodo: Date;
  etapas: RemoteEtapa[];
}

export interface RemoteEtapa {
  numero: NumeroEtapa;
  notas: RemoteNota[];
}

export interface RemoteNota {
  [key: string]: any;
  descricao: string;
  peso: number;
  notamaxima: number;
  nota: number;
}

export interface PeriodoInfo {
  nome: string;
  codigo: string;
}

export interface PeriodoCompleto extends PeriodoInfo {
  disciplinas: RemoteDisciplina[];
}

export enum StrategyType {
  QACADEMICO = 0
}

export interface IStrategy {

  login(username: string, password: string): Promise<void>;

  isLoggedIn(): boolean;

  getPeriodos(): Promise<PeriodoInfo[]>;

  getPeriodo(info: PeriodoInfo): Promise<PeriodoCompleto>;

  getFullName(): Promise<string>;

  getProfilePicture(): Promise<Buffer>;

  release(errored?: boolean): Promise<void>;

}

export namespace StrategyFactory {

  export async function build(type: StrategyType, endpoint: string): Promise<IStrategy | null> {
    switch (type) {
      case StrategyType.QACADEMICO:
        return new QAcademicoStrategy(endpoint);
    }
    return null;
  }

}
