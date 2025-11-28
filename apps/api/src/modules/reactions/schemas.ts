export const getReactionsSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        total: {
          type: 'object',
          additionalProperties: true,
        },
        current: {
          type: 'object',
          additionalProperties: true,
        },
      },
    },
  },
};
