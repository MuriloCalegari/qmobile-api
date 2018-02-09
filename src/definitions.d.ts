interface UserData {
  endpoint?: string;
  userid: string;
  sessionid: string;
}

declare namespace Express {

  export interface Request {
    userdata: UserData;
  }
}
