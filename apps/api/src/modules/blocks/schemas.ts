export const getBlockSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        blockData: {
          type: 'object',
          additionalProperties: true,
        },
        integration: {
          id: { type: 'string' },
          integrationType: { type: 'string' },
          createdAt: { type: 'string' },
        },
      },
      additionalProperties: false,
    },
    404: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
};

export const getEnabledBlockSchema = {
  response: {
    200: { type: 'array', items: { type: 'string' } },
    404: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
};

export const deleteBlockSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
      additionalProperties: false,
    },
    400: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  },
};

export const updateBlockDataSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        updatedAt: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  body: {
    type: 'object',
    properties: {
      newData: { type: 'object' },
    },
  },
};
