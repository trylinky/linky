import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export const ignores = {
  ignores: [
    '**/.next/**',
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.turbo/**',
    '**/coverage/**',
    '**/generated/**',
  ],
};

/**
 * Shared baseline for every workspace package.
 *
 * This file previously declared a parser and nothing else - no rules at all -
 * so `eslint .` passed unconditionally while the installed plugins sat unused.
 */
export const baseConfig = [
  ignores,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { '@typescript-eslint': tsPlugin },
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      // Unused code is usually a leftover, and occasionally a bug (an import
      // or destructured value someone meant to use). Warn for now; the
      // existing violations are being cleared incrementally.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-constant-condition': 'error',
      'no-dupe-keys': 'error',
      'no-unreachable': 'error',
      // `== null` is the idiomatic nullish check and is used deliberately.
      eqeqeq: ['error', 'always', { null: 'ignore' }],
    },
  },
];

export default baseConfig;
