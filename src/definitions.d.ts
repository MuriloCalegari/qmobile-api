interface UserData {
    endpoint?: string;
    userid: string;
}

declare namespace Express {

    export interface Request {
        userdata: UserData;
    }
}