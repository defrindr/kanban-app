import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import unicorn from 'eslint-plugin-unicorn';
import sonarjs from 'eslint-plugin-sonarjs';

export default [
  {
    ignores: ['dist/', 'node_modules/', '**/*.test.ts', '**/*.d.ts'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      unicorn,
      sonarjs,
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/await-thenable': 'warn',

      // Code quality
      'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-magic-numbers': 'off',
      'no-nested-ternary': 'warn',
      'complexity': ['warn', 12],

      // Unicorn rules
      'unicorn/no-array-for-each': 'warn',
      'unicorn/prefer-module': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/prevent-abbreviations': 'off',

      // SonarJS rules
      'sonarjs/cognitive-complexity': ['warn', 15],
      'sonarjs/no-duplicate-string': ['warn', { threshold: 4 }],
      'sonarjs/no-identical-functions': 'warn',

      // Best practices
      'eqeqeq': ['warn', 'always'],
      'no-var': 'error',
      'prefer-const': 'warn',
      'prefer-template': 'warn',
    },
  },
];
