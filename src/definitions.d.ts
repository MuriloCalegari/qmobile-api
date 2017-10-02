interface UserData {
    endpoint: string;
}

declare namespace Express {

    export interface Request {
        userdata: UserData;
    }
}