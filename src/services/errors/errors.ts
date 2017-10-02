export class QError extends Error {

    constructor(message: string) {
        super(message);
    }

}

export class QSiteError extends QError {

    constructor(public parent: Error, message?: string) {
        super(message || parent.message);
    }

}
export class QUserError extends QError {

    constructor(message: string) {
        super(message);
    }

}