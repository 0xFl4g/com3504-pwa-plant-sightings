const globals = require('globals');
const js = require('@eslint/js');

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
        ...globals.node,
        L: 'readonly',
        io: 'readonly',
        bootstrap: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_|^next$|^reject$',
        caughtErrorsIgnorePattern: '^_',
      }],
      'no-console': 'off',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'indent': ['error', 2],
      'comma-dangle': ['error', 'always-multiline'],
      'max-len': ['warn', {code: 120}],
      'no-useless-catch': 'off',
      'preserve-caught-error': 'off',
      'require-jsdoc': 'off',
      'valid-jsdoc': 'off',
    },
  },
  {
    ignores: ['public/vendor/**', 'node_modules/**'],
  },
];
