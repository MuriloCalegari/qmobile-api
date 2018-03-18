import * as uuidv4 from 'uuid/v4';

export class UUID {

  private constructor(private uuid: string) {}

  static from(id: string | UUID): UUID {
    return new UUID(id.toString());
  }

  static random(): UUID {
    return new UUID(uuidv4());
  }

  equals(another: UUID): boolean {
    return another.uuid === this.uuid;
  }

  toString(): string {
    return this.uuid;
  }

}
