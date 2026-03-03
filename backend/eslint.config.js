import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  eslintConfigPrettier,

  {
    files: ['**/**.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      prettier,
    },
    rules: {
      // Logical strictness
      'no-unused-vars': 'warn',
      'no-undef': 'error',
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'error',

      // Let Prettier handle formatting
      'prettier/prettier': 'error',
    },
  },
];
