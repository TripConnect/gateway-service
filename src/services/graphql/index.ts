import { readFileSync } from 'fs';
import { ApolloServer } from '@apollo/server';
const { ApolloServerPluginLandingPageLocalDefault } = require('apollo-server-core');
const depthLimit = require('graphql-depth-limit');

import resolvers from "services/graphql/resolvers";
const typeDefs = readFileSync(__dirname + '/schema.graphql', { encoding: 'utf-8' });
const GRAPHQL_MAX_DEPTH = process.env.GRAPHQL_MAX_DEPTH || 5;

export interface GatewayContext {
    currentUserId: string | null;
}

const gqlServer = new ApolloServer<GatewayContext>({
    typeDefs,
    resolvers,
    csrfPrevention: true,
    cache: 'bounded',
    plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
    validationRules: [depthLimit(GRAPHQL_MAX_DEPTH)],
    includeStacktraceInErrorResponses: false, // Set to true for debugging
});

export default gqlServer;
