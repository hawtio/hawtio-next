module.exports = {
  extends: [
    'react-app',
    'react-app/jest',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:testing-library/react',
  ],
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'import',
  ],
  rules: {
    'import/no-default-export': 'error',
    'semi': ['error', 'never'],
    '@typescript-eslint/no-empty-function': [
      'error',
      {
        'allow': ['constructors']
      }
    ],
    '@typescript-eslint/explicit-member-accessibility': [
      'warn',
      {
        accessibility: 'no-public'
      }
    ]
  },
  root: true,
}
