const path = require('path')
const { hawtioBackend } = require('@hawtio/backend-middleware')

module.exports = {
  webpack: {
    alias: {
      '@hawtio': path.resolve(__dirname, 'src/hawtio'),
    },
  },
  jest: {
    configure: {
      // Automatically clear mock calls and instances between every test
      clearMocks: true,

      moduleDirectories: [
        "<rootDir>/node_modules/",
        "<rootDir>/src/hawtio/test/"
      ],

      moduleNameMapper: {
        ['@hawtio/(.*)']: '<rootDir>/src/hawtio/$1',
        'react-markdown': '<rootDir>/node_modules/react-markdown/react-markdown.min.js'
      },

      // The path to a module that runs some code to configure or set up the testing framework before each test
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],

      testPathIgnorePatterns: [
        "<rootDir>/node_modules/",
        "<rootDir>/src/hawtio/test/"
      ],

      transformIgnorePatterns: [
        "node_modules/(?!@patternfly/react-icons/dist/esm/icons)/"
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
