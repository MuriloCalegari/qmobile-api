interface UserData {
    endpoint: string;
}

interface Disciplina {
    id?: string;
    turma: string;
    nome: string;
    professor: string;
    etapa1?: Nota[];
    etapa2?: Nota[];
}

interface Nota {
    id?: string;
    descricao: string;
    peso: number;
    notamaxima: number;
    nota: number;
}

declare namespace Express {

    export interface Request {
        userdata: UserData;
    }
}