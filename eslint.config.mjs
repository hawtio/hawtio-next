// @ts-check

import js from '@eslint/js'
import tsParser from '@typescript-eslint/parser'
import prettier from 'eslint-config-prettier'
import * as importPlugin from 'eslint-plugin-import'
import reactHooks from 'eslint-plugin-react-hooks'
import reactJsxRuntime from 'eslint-plugin-react/configs/jsx-runtime.js'
import reactRecommended from 'eslint-plugin-react/configs/recommended.js'
import testingLibrary from 'eslint-plugin-testing-library'
import ts from 'typescript-eslint'

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  reactRecommended,
  reactJsxRuntime,
  prettier,
  {
    languageOptions: { parser: tsParser },
    plugins: {
      'react-hooks': reactHooks,
      'testing-library': testingLibrary,
      import: importPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...testingLibrary.configs.react.rules,
      ...importPlugin.rules,
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
    ignores: [
      '**/.*',
      '/*.js',
      '!/packages/hawtio/scripts/*.js',
      '/*.cjs',
      '/app/*.js',
      '/app/*.cjs',
      '**/ignore/**',
      'jest.config.ts',
      'tsup.config.ts',
      'dist/',
      'build/',
    ],
  },
]
