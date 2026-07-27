import { blocks } from '@trylinky/blocks';

const UUID_PATTERN =
  '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';

/**
 * `block.type` indexes straight into the block registry, so an unknown value
 * used to throw on `blocks[type].defaults` and return a 500. Constraining it to
 * the registry keys also stops a client asking for a block the UI would not
 * offer it (see the isBeta gate in getEnabledBlocks).
 *
 * The id is client-generated so the editor can place the block optimistically
 * before the request resolves, so it has to be accepted - but it can at least
 * be required to look like the UUID the editor actually sends.
 */
export const createBlockSchema = {
  body: {
    type: 'object',
    required: ['block', 'pageSlug'],
    properties: {
      block: {
        type: 'object',
        required: ['id', 'type'],
        properties: {
          id: { type: 'string', pattern: UUID_PATTERN },
          type: { type: 'string', enum: Object.keys(blocks) },
        },
        additionalProperties: false,
      },
      pageSlug: { type: 'string', minLength: 1, maxLength: 100 },
    },
    additionalProperties: false,
  },
};

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
