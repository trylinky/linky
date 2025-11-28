export const getPageLayoutSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        xxs: {
          type: 'array',
          additionalProperties: true,
        },
        sm: {
          type: 'array',
          additionalProperties: true,
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

const themeFields = [
  'colorBgBase',
  'colorBgPrimary',
  'colorBgSecondary',
  'colorBorderPrimary',
  'colorTitlePrimary',
  'colorTitleSecondary',
  'colorLabelPrimary',
  'colorLabelSecondary',
  'colorLabelTertiary',
];

const themeFieldsSchema = {
  type: 'object',
  properties: {
    font: {
      type: 'string',
    },
    backgroundImage: {
      type: 'string',
    },
    ...themeFields.reduce((acc: Record<string, any>, field) => {
      acc[field] = {
        type: 'object',
        properties: {
          h: {
            type: 'number',
          },
          l: {
            type: 'number',
          },
          s: {
            type: 'number',
          },
        },
      };
      return acc;
    }, {}),
  },
};

export const getPageThemeSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        theme: themeFieldsSchema,
        backgroundImage: {
          type: 'string',
        },
        teamId: {
          type: 'string',
        },
        publishedAt: {
          type: 'string',
        },
      },
      additionalProperties: false,
    },
  },
};

export const getPageBlocksSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        blocks: {
          type: 'array',
          additionalProperties: true,
        },
        currentUserIsOwner: {
          type: 'boolean',
        },
      },
    },
  },
};

export const getCurrentUserTeamPagesSchema = {
  response: {
    200: {
      type: 'array',
      properties: {
        id: {
          type: 'string',
        },
        slug: {
          type: 'string',
        },
      },
      additionalProperties: false,
    },
  },
};

export const getPageSettingsSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
        publishedAt: {
          type: 'string',
        },
        slug: {
          type: 'string',
        },
        metaTitle: {
          type: 'string',
        },
        metaDescription: {
          type: 'string',
        },
        backgroundImage: {
          type: 'string',
        },
        themeId: {
          type: 'string',
        },
        verifiedAt: {
          type: 'string',
        },
      },
    },
  },
};

export const updatePageLayoutSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
      },
    },
  },
};

export const createPageSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
        slug: {
          type: 'string',
        },
      },
    },
    400: {
      type: 'object',
      properties: {
        error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
            },
          },
        },
      },
      additionalProperties: false,
    },
  },
};

export const deletePageSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
        },
      },
    },
  },
};
