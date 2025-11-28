export const tikTokOrchestratorSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        pageSlug: {
          type: 'string',
        },
      },
      additionalProperties: false,
    },
    400: {
      type: 'object',
      properties: {
        error: {
          type: 'string',
        },
      },
      additionalProperties: false,
    },
  },
};

export const orchestratorCreateSchema = {
  body: {
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['TIKTOK'] },
    },
    additionalProperties: false,
    required: ['type'],
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'string' },
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
  },
};

export const orchestratorValidateSchema = {
  body: {
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['TIKTOK'] },
      orchestrationId: { type: 'string' },
    },
    required: ['type', 'orchestrationId'],
  },
  response: {
    200: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
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
  },
};
