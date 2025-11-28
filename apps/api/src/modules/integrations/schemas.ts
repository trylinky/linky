export const getCurrentUserTeamIntegrationsSchema = {
  response: {
    200: {
      type: 'array',
      properties: {
        id: {
          type: 'string',
        },
        createdAt: {
          type: 'string',
        },
        type: {
          type: 'string',
        },
        displayName: {
          type: 'string',
        },
        blocks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pageId: {
                type: 'string',
              },
              slug: {
                type: 'string',
              },
            },
          },
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

export const disconnectIntegrationSchema = {
  body: {
    type: 'object',
    properties: {
      integrationId: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
      },
      additionalProperties: false,
    },
    400: {
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
      additionalProperties: false,
    },
    500: {
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
};

export const connectBlockSchema = {
  body: {
    type: 'object',
    properties: {
      integrationId: { type: 'string' },
      blockId: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
      },
    },
    400: {
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
    },
  },
};

export const disconnectBlockSchema = {
  body: {
    type: 'object',
    properties: {
      blockId: { type: 'string' },
      integrationId: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
      },
    },
    400: {
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
    },
  },
};
