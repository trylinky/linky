import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: [
      '**/.next/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/generated/**',
    ],
  },
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
