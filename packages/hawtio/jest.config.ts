export default {
  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // The path to a module that runs some code to configure or set up the testing framework before each test
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],

  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
  ],

  transformIgnorePatterns: [
    'node_modules/(?!@patternfly/react-icons/dist/esm/icons)/',
  ],

  coveragePathIgnorePatterns: [
    'node_modules/',
  ],
}
