module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'import',
  ],
  rules: {
    'import/no-default-export': 2,
    '@typescript-eslint/no-empty-function': [
      2,
      {
        'allow': ['constructors']
      }
    ],
  },
  root: true,
}
