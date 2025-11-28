import { FlatCompat } from '@eslint/eslintrc';
import pkg from '@typescript-eslint/parser';

const { parser } = pkg;

const compat = new FlatCompat();

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: [
          'apps/*/tsconfig.json',
          'packages/*/tsconfig.json',
          'tsconfig.json',
          'prettier.config.js',
        ],
      },
    },
  },
];
