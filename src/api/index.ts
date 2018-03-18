import * as express from 'express';
import * as bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { schema } from './schema';

const PORT = 3002;

const app = express();


app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));

app.get('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

app.listen(PORT);
