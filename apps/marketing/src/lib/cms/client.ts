import { GraphQLClient } from 'graphql-request';

const HYGRAPH_ENDPOINT = process.env.HYGRAPH_ENDPOINT;
const HYGRAPH_TOKEN = process.env.HYGRAPH_TOKEN;

export const isCmsEnabled = !!(HYGRAPH_ENDPOINT && HYGRAPH_TOKEN);

export const client = isCmsEnabled
  ? new GraphQLClient(HYGRAPH_ENDPOINT!, {
      headers: {
        Authorization: `Bearer ${HYGRAPH_TOKEN}`,
      },
    })
  : (null as unknown as GraphQLClient);
