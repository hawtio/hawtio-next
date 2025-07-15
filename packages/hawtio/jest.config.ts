import type { Config } from 'jest'

const config: Config = {
  // https://jestjs.io/docs/ecmascript-modules
  // while we can switch jest to use ESM, we use so many different modules that for now (2025), it's better
  // to let jest work in CJS mode - this means jest loads all files through a transformer that converts:
  //  - ts to js
  //  - esm to cjs
  // 1) preset: 'ts-jest' is the easiest option here.
  //     - node_modules/jest-config/build/index.js#setupPreset() resolves 'ts-jest' to 'node_modules/ts-jest/jest-preset.js'
  //       node_modules/ts-jest/dist/types.d.ts#DefaultPreset is just { transform: ... } definition
  preset: 'ts-jest',
  // 2) we can call a function that returns an object we can spread here (with ...)
  //    we need to use import { createJsWithBabelEsmPreset } from 'ts-jest' first
  // ...createJsWithBabelEsmPreset(),
  // 3) we can define 'transform' ourselves for most flexibility
  // transform: {
  //   "^.+\\.m?[jt]sx?$": ['ts-jest', { useESM: true, },],
  // },

  testEnvironment: './jsdom-test-env.ts',
  silent: false,

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // module mapper can be used for quick replacement of actual modules with our mocks - this is especially
  // useful if the Hawtio modules we test import some other modules with components, but we don't care about
  // what these components are.
  // if we for example wanted to _not_ map react-markdown module, we'd need to transform (babel or ts-jest for .js)
  // additional 48 modules from node_modules/, so ESM is transformed to CJS which is what jest uses internally.
  // if we follow https://jestjs.io/docs/ecmascript-modules, we'd have much more problems transforming from CJS to ESM
  // that's why moduleNameMapper is very good approach
  //
  // there are two kinds of mappings here:
  // 1. map from module location to a mocked module under /src/__mocks__ which usually just provide module.exports = ...
  // 2. map from module location to another module location inside node_modules/ if a module provides both ESM and CJS version
  //
  // Mind that "import { .. } from 'module-x'" is automatically mocked if there is src/__mocks__/module-x.js file
  moduleNameMapper: {
    // mocked modules that simply provide necessary, fake module.exports = ...
    // mock modules that are handled by webpack at application level
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|md)$': '<rootDir>/src/__mocks__/fileMock.js',
    '\\.(css)$': '<rootDir>/src/__mocks__/styleMock.js',

    // modules mocking by pointing to other modules/locations
    '@hawtiosrc/(.*)': '<rootDir>/src/$1',
    // icons will be loaded from ESM to CJS - otherwise we'd have to mock a lot of modules
    '@patternfly/react-icons/dist/esm/icons/(.*)': '<rootDir>/../../node_modules/@patternfly/react-icons/dist/js/icons/$1',
    // tokens will be loaded from ESM to CJS
    '@patternfly/react-tokens/dist/esm/(.*)': '<rootDir>/../../node_modules/@patternfly/react-tokens/dist/js/$1',
  },

  // The path to a module that runs some code to configure or set up the testing
  // framework before each test
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts']
}

export default config
