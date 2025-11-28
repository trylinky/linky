import { GraphQLClient } from 'graphql-request';

const HYGRAPH_ENDPOINT = process.env.HYGRAPH_ENDPOINT;
const HYGRAPH_TOKEN = process.env.HYGRAPH_TOKEN;

if (!HYGRAPH_ENDPOINT) {
  throw new Error('HYGRAPH_ENDPOINT is not defined');
}

if (!HYGRAPH_TOKEN) {
  throw new Error('HYGRAPH_TOKEN is not defined');
}

export const client = new GraphQLClient(HYGRAPH_ENDPOINT, {
  headers: {
    Authorization: `Bearer ${HYGRAPH_TOKEN}`,
  },
});
