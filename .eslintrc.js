module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:testing-library/react',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    'no-console': 'error',
    semi: ['error', 'never'],
    '@typescript-eslint/explicit-member-accessibility': [
      'warn',
      {
        accessibility: 'no-public',
      },
    ],
    '@typescript-eslint/no-empty-function': [
      'error',
      {
        allow: ['constructors'],
      },
    ],
    '@typescript-eslint/no-redeclare': 'off',
    'import/no-default-export': 'error',
    'react/prop-types': 'off',
    'testing-library/await-async-queries': 'off',
    'testing-library/no-debugging-utils': [
      'warn',
      {
        utilsToCheckFor: {
          debug: false,
        },
      },
    ],
    // Derived from react-app
    'no-undef': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        args: 'none',
        ignoreRestSiblings: true,
      },
    ],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  root: true,
}
