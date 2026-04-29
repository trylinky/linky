import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: [
          'apps/*/tsconfig.json',
          'packages/*/tsconfig.json',
          'tsconfig.json',
        ],
      },
    },
  },
];
