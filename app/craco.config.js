const { hawtioBackend } = require('@hawtio/backend-middleware')

module.exports = {
  webpack: {
    configure: {
      ignoreWarnings: [
        function ignoreSourcemapsloaderWarnings(warning) {
          return warning.module
            && warning.module.resource.includes('node_modules')
            && warning.details
            && warning.details.includes('source-map-loader')
        },
      ],
    },
  },
  jest: {
    configure: {
      // Automatically clear mock calls and instances between every test
      clearMocks: true,

      // The path to a module that runs some code to configure or set up the testing framework before each test
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],

      testPathIgnorePatterns: [
        '<rootDir>/node_modules/',
      ],

      transformIgnorePatterns: [
        'node_modules/(?!@patternfly/react-icons/dist/esm/icons)/'
      ],

      coveragePathIgnorePatterns: [
        'node_modules/',
        'src/examples/',
        'src/index.tsx',
        'src/reportWebVitals.ts',
      ],
    }
  },
  devServer: {
    setupMiddlewares: (middlewares) => {
      middlewares.push({
        name: 'hawtio-backend',
        path: '/proxy',
        middleware: hawtioBackend({
          // Uncomment it if you want to see debug log for Hawtio backend
          logLevel: 'debug',
        })
      })

      return middlewares
    }
  }
}
