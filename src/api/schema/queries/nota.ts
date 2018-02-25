import { Usuario } from './../../../models/usuario';
import { Session } from './../../../models/session';
export = {

  schema: `type Nota {
    session(id: ID!): User
  }`,

  resolvers: {

    Query: {
      async session(_, { id }, c): Promise<Usuario | null> {
        try {
          const session = (await Session.findById(id))!;
          const user = await session.$get('usuario') as Usuario;
          return user;
        } catch {
          return null;
        }
      }
    }

  }

};
