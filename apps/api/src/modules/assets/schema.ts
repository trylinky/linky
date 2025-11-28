export const uploadAssetSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        url: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
};
