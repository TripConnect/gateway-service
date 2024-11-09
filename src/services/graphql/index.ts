import { readFileSync } from 'fs';
import { ApolloServer } from '@apollo/server';
const { ApolloServerPluginLandingPageLocalDefault } = require('apollo-server-core');

import resolvers from "./resolvers";
const typeDefs = readFileSync(__dirname + '/schema.graphql', { encoding: 'utf-8' });

const gqlServer = new ApolloServer({
    typeDefs,
    resolvers,
    csrfPrevention: true,
    cache: 'bounded',
    plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
    includeStacktraceInErrorResponses: true, // Set to true for debugging
});

export default gqlServer;
